<script lang="ts">
	import { onMount } from 'svelte';
	import type { Profile, CsvData, ViewType } from '$lib/types';
	import { loadProfiles, saveProfiles, loadCurrentProfileId, saveCurrentProfileId, createNewProfile, generateId } from '$lib/utils/storage';
	import { downloadCsv } from '$lib/utils/csv';
	import { transformCsvData } from '$lib/utils/transformation';
	import MappingsView from '$lib/components/MappingsView.svelte';
	import MethodsView from '$lib/components/MethodsView.svelte';
	import ImportDialog from '$lib/components/ImportDialog.svelte';

	let profiles: Profile[] = $state([]);
	let currentProfile: Profile | null = $state(null);
	let inputCsv: CsvData | null = $state(null);
	let outputCsv: CsvData | null = $state(null);
	let activeView: ViewType = $state('mappings');
	let isEditingProfile = $state(false);
	let showImportDialog = $state(false);

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
		
		currentProfile.updatedAt = new Date().toISOString();
		const index = profiles.findIndex(p => p.id === currentProfile!.id);
		if (index >= 0) {
			profiles[index] = currentProfile;
			profiles = [...profiles];
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

	// Reactive updates
	$effect(() => {
		if (currentProfile) {
			generateOutput();
		}
	});
</script>

<div class="csv-mapper">
	<header class="header">
		<h1>CSV Mapper</h1>
		
		<div class="profile-section">
			<div class="profile-selector">
				<select bind:value={currentProfile} onchange={(e) => selectProfile((e.target as HTMLSelectElement).value as any)}>
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

		<div class="file-section">
			<button onclick={() => showImportDialog = true} class="upload-btn">
				Import CSV
			</button>
			
			{#if outputCsv}
				<button onclick={downloadOutput} class="download-btn">
					Download Result
				</button>
			{/if}
		</div>
	</header>

	{#if currentProfile}
		<nav class="view-tabs">
			<button 
				class="tab {activeView === 'mappings' ? 'active' : ''}"
				onclick={() => activeView = 'mappings'}
			>
				Mappings
			</button>
			<button 
				class="tab {activeView === 'methods' ? 'active' : ''}"
				onclick={() => activeView = 'methods'}
			>
				Methods
			</button>
		</nav>

		<main class="main-content">
			{#if activeView === 'mappings'}
				<MappingsView 
					bind:profile={currentProfile}
					{inputCsv}
					{outputCsv}
					onUpdate={saveCurrentProfile}
				/>
			{:else}
				<MethodsView 
					bind:profile={currentProfile}
					onUpdate={saveCurrentProfile}
				/>
			{/if}
		</main>
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

<style>
	.csv-mapper {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.header {
		background: #f8f9fa;
		padding: 1rem 2rem;
		border-bottom: 1px solid #dee2e6;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 2rem;
		flex-wrap: wrap;
	}

	h1 {
		margin: 0;
		color: #333;
		font-size: 1.8rem;
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
		gap: 0.5rem;
		align-items: center;
	}

	button {
		padding: 0.5rem 1rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		background: white;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	button:hover {
		background: #f8f9fa;
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

	.view-tabs {
		display: flex;
		background: #f8f9fa;
		border-bottom: 1px solid #dee2e6;
	}

	.tab {
		padding: 1rem 2rem;
		border: none;
		background: transparent;
		border-bottom: 3px solid transparent;
		cursor: pointer;
		font-weight: 500;
	}

	.tab:hover {
		background: #e9ecef;
	}

	.tab.active {
		border-bottom-color: #007bff;
		background: white;
	}

	.main-content {
		flex: 1;
		padding: 2rem;
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
