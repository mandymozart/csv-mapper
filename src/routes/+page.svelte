<script lang="ts">
	import { onMount } from 'svelte';
	import type { Profile, CsvData, ViewType } from '$lib/types';
	import { loadProfiles, saveProfiles, loadCurrentProfileId, saveCurrentProfileId, createNewProfile, exportProject, importProject, downloadFile } from '$lib/utils/storage';
	import { downloadCsv } from '$lib/utils/csv';
	import { transformCsvData } from '$lib/utils/transformation';
	import ImportDialog from '$lib/components/ImportDialog.svelte';
	import MappingsView from '$lib/components/MappingsView.svelte';
	import MethodsView from '$lib/components/MethodsView.svelte';
	
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
	let isEditingProfile = $state(false);
	let showImportDialog = $state(false);
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

	function createProfile() {
		const newProfile = createNewProfile();
		profiles = [...profiles, newProfile];
		currentProfile = newProfile;
		saveProfiles(profiles);
		saveCurrentProfileId(newProfile.id);
		isEditingProfile = true;
	}

	function selectProfile(profile: Profile) {
		currentProfile = profile;
		saveCurrentProfileId(profile.id);
	}

	function saveCurrentProfile() {
		if (!currentProfile) return;
		
		// Create a new profile object to avoid mutation issues
		const updatedProfile = {
			...currentProfile,
			updatedAt: new Date().toISOString()
		};
		
		const index = profiles.findIndex(p => p.id === currentProfile!.id);
		if (index >= 0) {
			profiles[index] = updatedProfile;
			profiles = [...profiles];
			currentProfile = updatedProfile;
			saveProfiles(profiles);
		}
		isEditingProfile = false;
	}

	function deleteProfile(profile: Profile) {
		if (confirm(`Are you sure you want to delete "${profile.name}"?`)) {
			profiles = profiles.filter(p => p.id !== profile.id);
			saveProfiles(profiles);
			
			if (currentProfile?.id === profile.id) {
				currentProfile = profiles.length > 0 ? profiles[0] : null;
				saveCurrentProfileId(currentProfile?.id || null);
			}
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
			Profiles
		</wa-tab>
		{#if currentProfile}
			<wa-tab slot="nav" panel="mappings" active={activeView === 'mappings'}>
				<wa-icon name="table" slot="prefix"></wa-icon>
				Mappings
			</wa-tab>
			<wa-tab slot="nav" panel="methods" active={activeView === 'methods'}>
				<wa-icon name="code" slot="prefix"></wa-icon>
				Methods
			</wa-tab>
			<wa-tab slot="nav" panel="import" active={activeView === 'import'}>
				<wa-icon name="upload" slot="prefix"></wa-icon>
				Import CSV
			</wa-tab>
		{/if}
		
		<wa-tab-panel name="profiles">
			<div class="profile-section">
				<div class="profile-selector">
					<label for="profile-select">Profile:</label>
					<select id="profile-select" value={currentProfile?.id || ''} 
						onchange={(e: Event) => {
							const target = e.target as HTMLSelectElement;
							const selectedId = target.value;
							if (selectedId === '' || selectedId === null) {
								currentProfile = null;
							} else {
								const foundProfile = profiles.find(p => p.id === selectedId);
								currentProfile = foundProfile || null;
							}
						}}>
						<option value="">Select a profile...</option>
						{#each profiles as profile}
							<option value={profile.id}>{profile.name}</option>
						{/each}
					</select>
					<wa-button variant="primary" onclick={createProfile}>
						<wa-icon name="plus" slot="prefix"></wa-icon>
						New Profile
					</wa-button>
				</div>

				{#if currentProfile}
					<div class="profile-info">
						{#if isEditingProfile}
							<div class="profile-edit">
								<wa-input 
									label="Profile Name"
									value={currentProfile?.name || ''} 
									placeholder="Profile name"
									oninput={(e: CustomEvent) => {
										if (currentProfile) currentProfile.name = e.detail.value;
									}}
									class="profile-name-input"
								></wa-input>
								<wa-input 
									label="Profile Description"
									value={currentProfile?.description || ''} 
									placeholder="Profile description"
									oninput={(e: CustomEvent) => {
										if (currentProfile) currentProfile.description = e.detail.value;
									}}
									class="profile-description-input"
									type="textarea"
								></wa-input>
								<div class="profile-actions">
									<wa-button variant="success" onclick={saveCurrentProfile}>
										<wa-icon name="check" slot="prefix"></wa-icon>
										Save
									</wa-button>
									<wa-button variant="default" onclick={() => isEditingProfile = false}>
										<wa-icon name="x" slot="prefix"></wa-icon>
										Cancel
									</wa-button>
								</div>
							</div>
						{:else}
							<div class="profile-display">
								<h2>{currentProfile.name}</h2>
								<p>{currentProfile.description}</p>
								<div class="profile-actions">
									<wa-button variant="default" onclick={() => isEditingProfile = true}>
										<wa-icon name="pencil" slot="prefix"></wa-icon>
										Edit
									</wa-button>
									<wa-button variant="danger" onclick={() => currentProfile && deleteProfile(currentProfile)}>
										<wa-icon name="trash" slot="prefix"></wa-icon>
										Delete
									</wa-button>
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<div class="no-profile">
						<p>Create or select a profile to get started</p>
					</div>
				{/if}
			</div>
		</wa-tab-panel>
		
		{#if currentProfile}
			<wa-tab-panel name="mappings">
				{#if activeView === 'mappings'}
					<MappingsView 
						bind:profile={currentProfile}
						{inputCsv}
						{outputCsv}
						onUpdate={saveCurrentProfile}
					/>
				{/if}
			</wa-tab-panel>
			
			<wa-tab-panel name="methods">
				{#if activeView === 'methods'}
					<MethodsView 
						bind:profile={currentProfile}
						onUpdate={saveCurrentProfile}
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
		background: hsl(0, 0%, 95%);
		color: white;
		padding: 1.5rem 2rem;
		border-bottom: none;
		box-shadow: 0 2px 10px rgba(0,0,0,0.1);
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

	.profile-section {
		padding: 2rem;
		max-width: 800px;
		margin: 0 auto;
	}

	.profile-selector {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.profile-selector select {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	.profile-info {
		background: white;
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid #e9ecef;
	}

	.profile-name-input {
		width: 100%;
		padding: 0.5rem;
		font-size: 1.2rem;
		font-weight: bold;
		border: 1px solid #ccc;
		border-radius: 4px;
		margin-bottom: 0.5rem;
	}

	.profile-description-input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		resize: vertical;
		min-height: 60px;
		margin-bottom: 0.5rem;
	}

	.profile-display h2 {
		margin: 0 0 0.5rem 0;
		color: #333;
	}

	.profile-display p {
		margin: 0 0 1rem 0;
		color: #666;
	}

	.profile-actions {
		display: flex;
		gap: 0.5rem;
	}

	.file-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: flex-end;
	}

	.project-actions,
	.csv-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.project-btn {
		background: #6f42c1;
		color: white;
		border-color: #6f42c1;
	}

	.project-btn:hover {
		background: #5a32a3;
	}

	button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		background: white;
		cursor: pointer;
		transition: all 0.2s ease;
		font-weight: 500;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}

	button:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0,0,0,0.15);
	}

	.save-btn {
		background: #28a745;
		color: white;
		border-color: #28a745;
	}

	.save-btn:hover {
		background: #218838;
	}

	.cancel-btn {
		background: #6c757d;
		color: white;
		border-color: #6c757d;
	}

	.delete-btn {
		background: #dc3545;
		color: white;
		border-color: #dc3545;
	}

	.delete-btn:hover {
		background: #c82333;
	}

	.upload-btn {
		background: #007bff;
		color: white;
		border-color: #007bff;
	}

	.upload-btn:hover {
		background: #0056b3;
	}

	.download-btn {
		background: #28a745;
		color: white;
		border-color: #28a745;
	}

	/* WebAwesome tab styling */
	wa-tab-group {
		--wa-tab-group-background: #f8f9fa;
		--wa-tab-background: transparent;
		--wa-tab-color: #6c757d;
		--wa-tab-active-color: #667eea;
		--wa-tab-active-background: white;
		--wa-tab-border-color: #dee2e6;
		--wa-tab-active-border-color: #667eea;
	}

	wa-tab-panel {
		padding: 2rem;
		background: #fafafa;
		min-height: calc(100vh - 200px);
	}

	.no-profile {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #666;
		font-size: 1.1rem;
	}
</style>
