<script lang="ts">
	import { onMount } from 'svelte';
	import type { Profile, CsvData, ViewType } from '$lib/types';
	import { loadProfiles, saveProfiles, loadCurrentProfileId, saveCurrentProfileId, createNewProfile, exportProject, importProject, downloadFile } from '$lib/utils/storage';
	import { downloadCsv } from '$lib/utils/csv';
	import { transformCsvData } from '$lib/utils/transformation';
	import ImportDialog from '$lib/components/ImportDialog.svelte';
	import MappingsView from '$lib/components/MappingsView.svelte';
	import MethodsView from '$lib/components/MethodsView.svelte';
	import ProfilesView from '$lib/components/ProfilesView.svelte';
	import { formatRelativeTime } from '$lib/utils/helpers';
	// Import WebAwesome styles and components
	import '@awesome.me/webawesome/dist/styles/themes/default.css';
	import '@awesome.me/webawesome/dist/components/button/button.js';
	import '@awesome.me/webawesome/dist/components/input/input.js';
	import '@awesome.me/webawesome/dist/components/icon/icon.js';
	import '@awesome.me/webawesome/dist/components/tab-group/tab-group.js';
	import '@awesome.me/webawesome/dist/components/tab/tab.js';
	import '@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js';

	let profiles: Profile[] = $state([]);
	let currentProfile: Profile | null = $state(null);
	let inputCsv: CsvData | null = $state(null);
	let outputCsv: CsvData | null = $state(null);
	let activeView: ViewType = $state('profiles');
	let projectFileInput: HTMLInputElement;
	let projectName = $state('');
	let isEditingProjectName = $state(false);
	let tempProjectName = $state('');

	onMount(() => {
		loadData();
	});

	function loadData() {
		profiles = loadProfiles();
		const currentProfileId = loadCurrentProfileId();
		
		if (currentProfileId) {
			currentProfile = profiles.find(p => p.id === currentProfileId) || null;
		}
		
		if (!currentProfile && profiles.length > 0) {
			currentProfile = profiles[0];
			saveCurrentProfileId(currentProfile.id);
		}
		
		// Load project name from localStorage
		projectName = loadProjectName();
	}
	
	function saveProjectName() {
		try {
			localStorage.setItem('csv-mapper-project-name', projectName);
		} catch (error) {
			console.error('Failed to save project name:', error);
		}
	}
	
	function loadProjectName(): string {
		try {
			return localStorage.getItem('csv-mapper-project-name') || '';
		} catch (error) {
			console.error('Failed to load project name:', error);
			return '';
		}
	}
	
	function startEditingProjectName() {
		tempProjectName = projectName || '';
		isEditingProjectName = true;
	}
	
	function saveProjectNameEdit() {
		console.log('Save clicked, tempProjectName:', tempProjectName);
		const newName = (tempProjectName || '').trim();
		console.log('Trimmed name:', newName);
		if (newName) {
			projectName = newName;
			console.log('Setting projectName to:', projectName);
			saveProjectName();
			isEditingProjectName = false;
		} else {
			console.log('Name is empty, staying in edit mode');
		}
	}
	
	function cancelProjectNameEdit() {
		tempProjectName = projectName || '';
		isEditingProjectName = false;
	}

	function updateCurrentProfile() {
		if (currentProfile) {
			currentProfile.updatedAt = new Date().toISOString();
			saveProfiles(profiles);
		}
	}

	function handleCsvImport(data: CsvData) {
		inputCsv = data;
		generateOutput();
	}

	function generateOutput() {
		if (!inputCsv || !currentProfile) {
			outputCsv = null;
			return;
		}

		outputCsv = transformCsvData(inputCsv, currentProfile.mappings, currentProfile.methods);
	}

	function downloadOutput() {
		if (!outputCsv) return;
		downloadCsv(outputCsv, `${currentProfile?.name || 'output'}_mapped.csv`);
	}

	function downloadProject() {
		const filename = (projectName || '').trim() || 'csv-mapper-project';
		exportProject(profiles, filename);
	}

	function loadProject() {
		projectFileInput.click();
	}

	async function handleProjectFileSelect(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;

		try {
			const content = await file.text();
			const result = importProject(content);
			
			if (result.success) {
				// Extract filename without extension and set as project name
				const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove file extension
				projectName = fileName;
				saveProjectName(); // Save to localStorage
				
				// Reload data after successful import
				loadData();
				alert(result.message);
			} else {
				alert(`Import failed: ${result.message}`);
			}
		} catch (error) {
			alert('Failed to read project file');
		}

		// Reset file input
		projectFileInput.value = '';
	}

	// Reactive updates
	$effect(() => {
		if (currentProfile) {
			generateOutput();
		}
	});
</script>

<div class="csv-mapper">
	<header class="header">
		<div class="project-info">
			{#if isEditingProjectName}
				<div class="project-name-edit">
					<input 
						bind:value={tempProjectName} 
						placeholder="Enter project name"
						class="project-name-input-edit"
						type="text"
					/>
					<div class="project-name-actions">
						<wa-button variant="success" size="small" onclick={saveProjectNameEdit}>
							<wa-icon name="check" slot="prefix"></wa-icon>
							Save
						</wa-button>
						<wa-button variant="default" size="small" onclick={cancelProjectNameEdit}>
							<wa-icon name="x" slot="prefix"></wa-icon>
							Cancel
						</wa-button>
					</div>
				</div>
			{:else}
				<h1 class="project-name" onclick={startEditingProjectName}>
					{projectName || 'Untitled Project'}
					<wa-icon name="pencil" class="edit-icon"></wa-icon>
				</h1>
			{/if}
			{#if profiles.length > 0}
								{@const latestProfile = profiles.reduce((latest, profile) => 
									new Date(profile.updatedAt) > new Date(latest.updatedAt) ? profile : latest
								)}
								<wa-badge appearance="filled" variant="neutral" pill size="small">
									Last Save: {formatRelativeTime(latestProfile.updatedAt)}
								</wa-badge>
							{/if}
		</div>

		<div class="header-actions">
			<div class="project-actions">
				<wa-button variant="default" onclick={loadProject}>
					<wa-icon name="folder-open" slot="prefix"></wa-icon>
					Load Project
				</wa-button>
				<wa-button variant="default" onclick={downloadProject}>
					<wa-icon name="download" slot="prefix"></wa-icon>
					Export Project
				</wa-button>
				{#if outputCsv}
					<wa-button variant="success" onclick={downloadOutput}>
						<wa-icon name="file-arrow-down" slot="prefix"></wa-icon>
						Download Output
					</wa-button>
				{/if}
			</div>
		</div>
	</header>

	<wa-tab-group placement="top" onwa-tab-show={(e: CustomEvent) => activeView = e.detail.name}>
		<wa-tab slot="nav" panel="profiles" active={activeView === 'profiles'}>
			<wa-icon name="user-group" slot="prefix"></wa-icon>
			Profiles&nbsp;
			{#if profiles.length > 0}
				<wa-badge appearance="outlined" variant="neutral" pill size="small">{profiles.length}</wa-badge>
			{/if}
			&nbsp;
			{#if currentProfile}
				<wa-badge appearance="filled" variant="brand" pill size="small">{currentProfile.name}</wa-badge>
			{/if}
		</wa-tab>
		{#if currentProfile}
			<wa-tab slot="nav" panel="mappings" active={activeView === 'mappings'}>
				<wa-icon name="table" slot="prefix"></wa-icon>
				Mappings&nbsp;
				<wa-badge appearance="outlined" variant="neutral" pill size="small">{currentProfile.mappings.filter(m => m.isActive).length} / {currentProfile.mappings.length}</wa-badge>
			</wa-tab>
			<wa-tab slot="nav" panel="methods" active={activeView === 'methods'}>
				<wa-icon name="code" slot="prefix"></wa-icon>
				Methods&nbsp;
				<wa-badge appearance="outlined" variant="neutral" pill size="small">{currentProfile.methods.length}</wa-badge>
			</wa-tab>
			<wa-tab slot="nav" panel="import" active={activeView === 'import'}>
				<wa-icon name="upload" slot="prefix"></wa-icon>
				Import CSV&nbsp;
				<wa-badge appearance={inputCsv ? 'filled' : 'filled outlined'} pill variant={inputCsv ? 'success' : 'warning'} size="small">
					{inputCsv ? (inputCsv.filename || 'Loaded') : 'None'}
				</wa-badge>
			</wa-tab>
		{/if}
		
		<wa-tab-panel name="profiles">
			<ProfilesView 
				{profiles} 
				{currentProfile} 
				onProfileSelect={(profile) => currentProfile = profile}
				onProfileUpdate={() => saveProfiles(profiles)}
			/>
		</wa-tab-panel>
		
		{#if currentProfile}
			<wa-tab-panel name="mappings">
				{#if activeView === 'mappings'}
					<MappingsView 
						bind:profile={currentProfile}
						{inputCsv}
						{outputCsv}
						onUpdate={updateCurrentProfile}
					/>
				{/if}
			</wa-tab-panel>
			
			<wa-tab-panel name="methods">
				{#if activeView === 'methods'}
					<MethodsView 
						bind:profile={currentProfile}
						onUpdate={updateCurrentProfile}
					/>
				{/if}
			</wa-tab-panel>
			
			<wa-tab-panel name="import">
				{#if activeView === 'import'}
					<ImportDialog 
						isOpen={true}
						onClose={() => activeView = 'mappings'}
						onImport={handleCsvImport}
						inline={true}
					/>
				{/if}
			</wa-tab-panel>
		{/if}
	</wa-tab-group>
</div>


<!-- Hidden file input for project import -->
<input 
	type="file" 
	accept=".json"
	bind:this={projectFileInput}
	onchange={handleProjectFileSelect}
	style="display: none;"
/>

<style>
	.csv-mapper {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.header {
		color: white;
		padding: 1rem 1rem;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 2rem;
		flex-wrap: wrap;
	}

	.project-info {
		flex: 1;
		min-width: 300px;
	}

	.storage-stats {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.project-name {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #333;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border-radius: 4px;
		transition: background-color 0.2s ease;
	}
	
	.project-name:hover {
		background-color: rgba(0, 0, 0, 0.05);
	}
	
	.project-name .edit-icon {
		opacity: 0;
		transition: opacity 0.2s ease;
		font-size: 0.8rem;
	}
	
	.project-name:hover .edit-icon {
		opacity: 0.6;
	}
	
	.project-name-edit {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.project-name-input-edit {
		width: 300px;
	}
	
	.project-name-actions {
		display: flex;
		gap: 0.25rem;
	}


	
	wa-tab-panel {
		padding: 2rem;
		background: #fafafa;
		min-height: calc(100vh - 200px);
	}
</style>
