<script lang="ts">
	import type { Profile } from '../types';
	import { generateId } from '../utils/helpers';

	interface Props {
		profiles: Profile[];
		currentProfile: Profile | null;
		onProfileSelect: (profile: Profile | null) => void;
		onProfileUpdate: () => void;
	}

	let { profiles, currentProfile, onProfileSelect, onProfileUpdate }: Props = $props();
	let isEditingProfile = $state(false);

	function createProfile() {
		const newProfile: Profile = {
			id: generateId(),
			name: `Profile ${profiles.length + 1}`,
			description: '',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			mappings: [],
			methods: []
		};
		
		profiles.push(newProfile);
		onProfileSelect(newProfile);
		isEditingProfile = true;
		onProfileUpdate();
	}

	function saveCurrentProfile() {
		if (!currentProfile) return;
		
		const trimmedName = currentProfile.name.trim();
		if (!trimmedName) {
			alert('Profile name cannot be empty');
			return;
		}
		
		currentProfile.name = trimmedName;
		isEditingProfile = false;
		onProfileUpdate();
	}

	function deleteProfile(profile: Profile) {
		if (!confirm(`Are you sure you want to delete "${profile.name}"?`)) return;
		
		const index = profiles.findIndex(p => p.id === profile.id);
		if (index !== -1) {
			profiles.splice(index, 1);
			
			// If we deleted the current profile, clear selection
			if (currentProfile?.id === profile.id) {
				onProfileSelect(null);
			}
			
			onProfileUpdate();
		}
	}
</script>

<div class="profiles-header">
    <h3>Profiles</h3>
    <wa-button variant="primary" size="small" onclick={createProfile}>
        <wa-icon name="plus" slot="prefix"></wa-icon>
        New
    </wa-button>
</div>
<div class="profiles-layout">
	<div class="profiles-sidebar">
		<div class="profiles-list">
			{#each profiles as profile}
				<button 
					class="profile-item {currentProfile?.id === profile.id ? 'active' : ''}"
					onclick={() => onProfileSelect(profile)}
					type="button"
				>
					<div class="profile-item-content">
						<div class="profile-name">{profile.name}</div>
						<div class="profile-description">{profile.description || 'No description'}</div>
					</div>
				</button>
			{/each}
			{#if profiles.length === 0}
				<div class="empty-profiles">
					<p>No profiles yet</p>
					<p class="empty-hint">Click "New" to create your first profile</p>
				</div>
			{/if}
		</div>
	</div>

	<div class="profile-details">
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
				<wa-icon name="user-group" style="font-size: 3rem; color: var(--wa-color-neutral-400); margin-bottom: 1rem;"></wa-icon>
				<h3>Select a Profile</h3>
				<p>Choose a profile from the sidebar to view and edit its details</p>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Profiles Layout */
	.profiles-layout {
		display: flex;
		gap: 0;
	}

	.profiles-sidebar {
		width: 300px;
		display: flex;
		flex-direction: column;
        background: #ffffff;
        padding: 1rem;
        border-radius: 1rem;
	}

	.profiles-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.profiles-header h3 {
		margin: 0;
		color: #333;
	}

	.profiles-list {
		flex: 1;
		overflow-y: auto;
	}

	.profile-item {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid #f1f3f4;;
		border-radius: 4px;
		background: transparent;
		cursor: pointer;
		text-align: left;
        margin-bottom: 1rem;
	}

	.profile-item:hover {
		background: #aaaaaa;
	}

	.profile-item.active {
		background: #ffffff;
	}

	.profile-item-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.profile-name {
		font-weight: 500;
		color: #212529;
		font-size: 0.9rem;
	}

	.profile-description {
		font-size: 0.8rem;
		color: #6c757d;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.empty-profiles {
		padding: 2rem 1rem;
		text-align: center;
		color: #6c757d;
	}

	.empty-profiles p {
		margin: 0.5rem 0;
	}

	.empty-hint {
		font-size: 0.85rem;
		opacity: 0.8;
	}

	.profile-details {
		flex: 1;
		padding: 0 2rem;
		overflow-y: auto;
	}

	.no-profile {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: #666;
		font-size: 1.1rem;
		text-align: center;
	}

	.no-profile h3 {
		margin: 0.5rem 0;
		color: #495057;
	}

	.no-profile p {
		margin: 0;
		color: #6c757d;
	}

	.profile-info {
		max-width: 600px;
	}

	.profile-display h2 {
		margin: 0 0 1rem 0;
		color: #212529;
	}

	.profile-display p {
		margin: 0 0 2rem 0;
		color: #6c757d;
		line-height: 1.5;
	}

	.profile-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.profile-edit {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.profile-name-input,
	.profile-description-input {
		width: 100%;
	}
</style>
