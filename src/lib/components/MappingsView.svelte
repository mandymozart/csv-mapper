<script lang="ts">
	import type { Profile, CsvData, ColumnMapping } from '$lib/types';
	import { generateId } from '$lib/utils/storage';
	import Preview from './Preview.svelte';

	interface Props {
		profile: Profile;
		inputCsv: CsvData | null;
		outputCsv: CsvData | null;
		onUpdate: () => void;
	}

	let { profile = $bindable(), inputCsv, outputCsv, onUpdate }: Props = $props();


	function addMapping() {
		const newMapping: ColumnMapping = {
			id: generateId(),
			sourceColumn: '',
			targetColumn: '',
			transformation: '',
			isActive: true
		};
		
		// Initialize mappings array if it doesn't exist
		if (!profile.mappings) {
			profile.mappings = [];
		}
		
		profile.mappings = [...profile.mappings, newMapping];
		onUpdate();
	}

	function removeMapping(mappingId: string) {
		if (profile.mappings) {
			profile.mappings = profile.mappings.filter(m => m.id !== mappingId);
			onUpdate();
		}
	}

	function updateMapping(mappingId: string, field: keyof ColumnMapping, value: any) {
		if (profile.mappings) {
			const mapping = profile.mappings.find(m => m.id === mappingId);
			if (mapping) {
				(mapping as any)[field] = value;
				profile.mappings = [...profile.mappings];
				onUpdate();
			}
		}
	}


	function getOutputPreviewValue(mapping: ColumnMapping, rowIndex: number = 0): string {
		if (!outputCsv) return '';
		
		// Use sourceColumn as targetColumn if targetColumn is empty
		const targetColumn = mapping.targetColumn || mapping.sourceColumn;
		return outputCsv.rows[rowIndex]?.[targetColumn] || '';
	}

	function getEffectiveTargetName(mapping: ColumnMapping): string {
		return mapping.targetColumn || mapping.sourceColumn || 'Unnamed';
	}
</script>

<div class="mappings-view">
	<div class="mappings-header">
		<h3>Column Mappings</h3>
		<button onclick={addMapping} class="add-mapping-btn">Add Mapping</button>
	</div>

	{#if !profile.mappings || profile.mappings.length === 0}
		<div class="empty-state">
			<p>No mappings defined. Click "Add Mapping" to create your first column mapping.</p>
		</div>
	{:else}
		<div class="mappings-container">
			<div class="mappings-grid">
				<div class="grid-header">
					<div class="input-section">Input Data</div>
					<div class="mapping-section">Mapping Configuration</div>
					<div class="output-section">Output Preview</div>
				</div>

				{#each profile.mappings as mapping (mapping.id)}
					<div class="mapping-row {mapping.isActive ? 'active' : 'inactive'}">
						<!-- Input Section -->
						<div class="input-section">
							<div class="section-content">
								<label>Source Column:</label>
								<select 
									bind:value={mapping.sourceColumn}
									onchange={() => updateMapping(mapping.id, 'sourceColumn', mapping.sourceColumn)}
								>
									<option value="">Select column...</option>
									{#if inputCsv}
										{#each inputCsv.headers as header}
											<option value={header}>{header}</option>
										{/each}
									{/if}
								</select>
								
								{#if mapping.sourceColumn && inputCsv}
									<div class="preview-value">
										<strong>Sample:</strong> {inputCsv.rows[0]?.[mapping.sourceColumn] || 'N/A'}
									</div>
								{/if}
							</div>
						</div>

						<!-- Mapping Section -->
						<div class="mapping-section">
							<div class="section-content">
								<div class="mapping-controls">
									<label>
										<input 
											type="checkbox" 
											bind:checked={mapping.isActive}
											onchange={() => updateMapping(mapping.id, 'isActive', mapping.isActive)}
										/>
										Active
									</label>
									<button 
										onclick={() => removeMapping(mapping.id)} 
										class="remove-btn"
										title="Remove mapping"
									>
										×
									</button>
								</div>

								<label>Target Name (optional):</label>
								<input 
									type="text" 
									bind:value={mapping.targetColumn}
									onchange={() => updateMapping(mapping.id, 'targetColumn', mapping.targetColumn)}
									placeholder="Leave empty to use original column name"
								/>

								<label>Transformation (optional):</label>
								<input 
									type="text" 
									bind:value={mapping.transformation}
									onchange={() => updateMapping(mapping.id, 'transformation', mapping.transformation)}
									placeholder="Leave empty to use original value"
								/>

								<div class="transformation-help">
									<small>
										Use &#123;COLUMN_NAME&#125; for column variables or methodName(args) for custom functions
									</small>
								</div>
							</div>
						</div>

						<!-- Output Section -->
						<div class="output-section">
							<div class="section-content">
								<label>Target: {getEffectiveTargetName(mapping)}</label>
								
								{#if mapping.isActive && mapping.sourceColumn}
									<div class="preview-value">
										<strong>Preview:</strong> {getOutputPreviewValue(mapping)}
									</div>
								{:else}
									<div class="preview-value inactive-preview">
										Mapping inactive or incomplete
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if inputCsv}
		<Preview 
			data={inputCsv} 
			title="Input Data Preview"
			showLineNumbers={true}
			hasHeaders={false}
			collapsible={true}
			defaultCollapsed={false}
		/>
	{/if}

	{#if outputCsv && outputCsv.headers.length > 0}
		<Preview 
			data={outputCsv} 
			title="Output Data Preview"
			showLineNumbers={true}
			hasHeaders={false}
			collapsible={true}
			defaultCollapsed={false}
		/>
	{/if}
</div>

<style>
	.mappings-view {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.mappings-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.mappings-header h3 {
		margin: 0;
		color: #333;
	}

	.add-mapping-btn {
		background: #007bff;
		color: white;
		border: 1px solid #007bff;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
	}

	.add-mapping-btn:hover {
		background: #0056b3;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: #666;
		background: #f8f9fa;
		border-radius: 8px;
		border: 2px dashed #dee2e6;
	}

	.mappings-container {
		background: white;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		overflow: hidden;
	}

	.mappings-grid {
		display: flex;
		flex-direction: column;
	}

	.grid-header {
		display: grid;
		grid-template-columns: 1fr 2fr 1fr;
		background: #f8f9fa;
		border-bottom: 2px solid #dee2e6;
		font-weight: bold;
		color: #495057;
	}

	.grid-header > div {
		padding: 1rem;
		border-right: 1px solid #dee2e6;
	}

	.grid-header > div:last-child {
		border-right: none;
	}

	.mapping-row {
		display: grid;
		grid-template-columns: 1fr 2fr 1fr;
		border-bottom: 1px solid #dee2e6;
		transition: opacity 0.2s;
	}

	.mapping-row.inactive {
		opacity: 0.6;
		background: #f8f9fa;
	}

	.mapping-row > div {
		border-right: 1px solid #dee2e6;
	}

	.mapping-row > div:last-child {
		border-right: none;
	}

	.section-content {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.mapping-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.remove-btn {
		background: #dc3545;
		color: white;
		border: none;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		cursor: pointer;
		font-size: 16px;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.remove-btn:hover {
		background: #c82333;
	}

	label {
		font-weight: 500;
		color: #495057;
		font-size: 0.9rem;
	}

	input, select {
		padding: 0.5rem;
		border: 1px solid #ced4da;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	input:focus, select:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
	}

	.preview-value {
		background: #f8f9fa;
		padding: 0.5rem;
		border-radius: 4px;
		font-size: 0.85rem;
		border: 1px solid #e9ecef;
	}

	.inactive-preview {
		color: #6c757d;
		font-style: italic;
	}

	.transformation-help {
		margin-top: 0.25rem;
	}

	.transformation-help small {
		color: #6c757d;
		font-style: italic;
	}

</style>
