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
	let activeView: ViewType = $state('mappings');
	let isEditingProfile = $state(false);
	let showImportDialog = $state(false);
	let projectFileInput: HTMLInputElement;

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
		exportProject(profiles);
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
		<div class="profile-section">
			<div class="profile-selector">
				<select bind:value={currentProfile}>
					<option value={null}>Select a profile...</option>
					{#each profiles as profile}
						<option value={profile}>{profile.name}</option>
					{/each}
				</select>
				<button onclick={createProfile}>New Profile</button>
			</div>

			{#if currentProfile}
				<div class="profile-info">
					{#if isEditingProfile}
						<div class="profile-edit">
							<input 
								bind:value={currentProfile.name} 
								placeholder="Profile name"
								class="profile-name-input"
							/>
							<textarea 
								bind:value={currentProfile.description} 
								placeholder="Profile description"
								class="profile-description-input"
							></textarea>
							<div class="profile-actions">
								<button onclick={saveCurrentProfile} class="save-btn">Save</button>
								<button onclick={() => isEditingProfile = false} class="cancel-btn">Cancel</button>
							</div>
						</div>
					{:else}
						<div class="profile-display">
							<h2>{currentProfile.name}</h2>
							<p>{currentProfile.description}</p>
							<div class="profile-actions">
								<button onclick={() => isEditingProfile = true} class="edit-btn">Edit</button>
								<button onclick={() => currentProfile && deleteProfile(currentProfile)} class="delete-btn">Delete</button>
							</div>
						</div>
					{/if}
				</div>
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
			</div>
			<div class="csv-actions">
				<wa-button variant="primary" onclick={() => showImportDialog = true}>
					<wa-icon name="upload" slot="prefix"></wa-icon>
					Import CSV
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

	{#if currentProfile}
		<wa-tab-group placement="top" onwa-tab-show={(e: CustomEvent) => activeView = e.detail.name}>
			<wa-tab slot="nav" panel="mappings" active={activeView === 'mappings'}>
				<wa-icon name="table" slot="prefix"></wa-icon>
				Mappings
			</wa-tab>
			<wa-tab slot="nav" panel="methods" active={activeView === 'methods'}>
				<wa-icon name="code" slot="prefix"></wa-icon>
				Methods
			</wa-tab>
			
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
		</wa-tab-group>
	{:else}
		<div class="no-profile">
			<p>Create or select a profile to get started</p>
		</div>
	{/if}
</div>

<ImportDialog 
	isOpen={showImportDialog}
	onClose={() => showImportDialog = false}
	onImport={handleCsvImport}
/>

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

	h1 {
		margin: 0;
		color: white;
		font-size: 2rem;
		font-weight: 600;
		text-shadow: 0 1px 3px rgba(0,0,0,0.3);
	}

	.profile-section {
		flex: 1;
		min-width: 300px;
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
