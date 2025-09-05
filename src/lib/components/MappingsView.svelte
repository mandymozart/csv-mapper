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

	// Row selection for preview
	let selectedPreviewRow = $state(0);

	// Reset preview row when profile changes
	$effect(() => {
		if (profile) {
			selectedPreviewRow = 0;
		}
	});

	function addMapping() {
		const newMapping: ColumnMapping = {
			id: generateId(),
			sourceColumn: '',
			targetColumn: '',
			transformation: '',
			isActive: false
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

	function moveMappingUp(index: number) {
		if (index > 0 && profile.mappings) {
			const mappings = [...profile.mappings];
			[mappings[index - 1], mappings[index]] = [mappings[index], mappings[index - 1]];
			profile.mappings = mappings;
			onUpdate();
		}
	}

	function moveMappingDown(index: number) {
		if (index < profile.mappings.length - 1 && profile.mappings) {
			const mappings = [...profile.mappings];
			[mappings[index], mappings[index + 1]] = [mappings[index + 1], mappings[index]];
			profile.mappings = mappings;
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


	function getInputPreviewValue(mapping: ColumnMapping, rowIndex: number = selectedPreviewRow): string {
		if (!inputCsv || !mapping.sourceColumn) return '';
		return inputCsv.rows[rowIndex]?.[mapping.sourceColumn] || 'N/A';
	}

	function getOutputPreviewValue(mapping: ColumnMapping, rowIndex: number = selectedPreviewRow): string {
		if (!outputCsv) return '';
		
		// Use sourceColumn as targetColumn if targetColumn is empty
		const targetColumn = mapping.targetColumn || mapping.sourceColumn;
		return outputCsv.rows[rowIndex]?.[targetColumn] || '';
	}

	function getEffectiveTargetName(mapping: ColumnMapping): string {
		if (mapping.hasCustomTarget && mapping.targetColumn) {
			return mapping.targetColumn;
		}
		return mapping.sourceColumn || 'Unnamed';
	}
</script>

<div class="mappings-view">
	<div class="mappings-header">
		<div class="header-controls">
			{#if inputCsv && inputCsv.rows.length > 0}
				<div class="row-selector">
					<label for="preview-row">Preview Row:</label>
					<select id="preview-row" value={selectedPreviewRow} onchange={(e: Event) => selectedPreviewRow = parseInt((e.target as HTMLSelectElement).value)}>
						{#each inputCsv.rows as _, index}
							<option value={index}>Row {index + 1}</option>
						{/each}
					</select>
				</div>
			{/if}
		</div>
	</div>

	{#if !profile.mappings || profile.mappings.length === 0}
		<div class="empty-state">
			<p>No mappings defined. Click "Add Mapping" to create your first column mapping.</p>
		</div>
	{:else}
		<div class="mappings-container">
			<div class="mappings-grid">
				<div class="grid-header">
					<div class="reorder-section"></div>
					<div class="input-section">Input</div>
					<div class="mapping-section">Config</div>
					<div class="output-section">Output</div>
				</div>

				{#each profile.mappings as mapping, index (mapping.id)}
					<div class="mapping-row {mapping.isActive ? 'active' : 'inactive'}">
						<!-- Reorder Controls -->
						<div class="reorder-controls">
							<wa-button 
								variant="ghost" 
								size="small"
								onclick={() => moveMappingUp(index)}
								disabled={index === 0}
							>
								<wa-icon name="chevron-up"></wa-icon>
							</wa-button>
							<wa-button 
								variant="ghost" 
								size="small"
								onclick={() => moveMappingDown(index)}
								disabled={index === profile.mappings.length - 1}
							>
								<wa-icon name="chevron-down"></wa-icon>
							</wa-button>
						</div>
						
						<!-- Input Section -->
						<div class="input-section">
							<div class="section-content">
								{#if inputCsv}
									<select 
										value={mapping.sourceColumn || ''}
										onchange={(e: Event) => {
											mapping.sourceColumn = (e.target as HTMLSelectElement).value;
											updateMapping(mapping.id, 'sourceColumn', mapping.sourceColumn);
										}}
									>
										<option value="">Select column...</option>
										{#each inputCsv.headers as header}
											<option value={header}>{header}</option>
										{/each}
									</select>
								{:else}
									<div class="memorized-value">
										{mapping.sourceColumn || 'No column selected'}
									</div>
								{/if}
								
								{#if mapping.sourceColumn && inputCsv}
									<div class="preview-value">
										{getInputPreviewValue(mapping)}
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
											checked={mapping.isActive}
											onchange={(e: Event) => {
												mapping.isActive = (e.target as HTMLInputElement).checked;
												updateMapping(mapping.id, 'isActive', mapping.isActive);
											}}
										/>
										Active
									</label>
									<wa-button 
										onclick={() => removeMapping(mapping.id)} 
										variant="text"
										size="small"
										title="Remove mapping"
									>
										<wa-icon name="x"></wa-icon>
									</wa-button>
								</div>

								<label>
									<input 
										type="checkbox"
										checked={mapping.hasCustomTarget || false}
										onchange={(e: Event) => {
											mapping.hasCustomTarget = (e.target as HTMLInputElement).checked;
											if (!mapping.hasCustomTarget) {
												mapping.targetColumn = '';
											}
											updateMapping(mapping.id, 'hasCustomTarget', mapping.hasCustomTarget);
											updateMapping(mapping.id, 'targetColumn', mapping.targetColumn);
										}}
									/>
									Custom Target Name
								</label>
								{#if mapping.hasCustomTarget}
									<input 
										type="text"
										value={mapping.targetColumn || ''}
										onchange={(e: Event) => {
											mapping.targetColumn = (e.target as HTMLInputElement).value;
											updateMapping(mapping.id, 'targetColumn', mapping.targetColumn);
										}}
										placeholder="Enter custom target column name"
									/>
								{/if}

								<label>
									<input 
										type="checkbox"
										checked={mapping.hasTransformation || false}
										onchange={(e: Event) => {
											mapping.hasTransformation = (e.target as HTMLInputElement).checked;
											if (!mapping.hasTransformation) {
												mapping.transformation = '';
											}
											updateMapping(mapping.id, 'hasTransformation', mapping.hasTransformation);
											updateMapping(mapping.id, 'transformation', mapping.transformation);
										}}
									/>
									Transformation
								</label>
								{#if mapping.hasTransformation}
									<div class="transformation-config">
										<label>Method:</label>
										<select 
											value={mapping.transformationMethod || ''}
											onchange={(e: Event) => {
												mapping.transformationMethod = (e.target as HTMLSelectElement).value;
												// Reset parameters when method changes
												mapping.transformationParams = [];
												updateMapping(mapping.id, 'transformationMethod', mapping.transformationMethod);
												updateMapping(mapping.id, 'transformationParams', mapping.transformationParams);
											}}
										>
											<option value="">Select method...</option>
											{#if profile.methods}
												{#each profile.methods as method}
													<option value={method.id}>{method.name}</option>
												{/each}
											{/if}
										</select>
										
										{#if mapping.transformationMethod && profile.methods}
											{@const selectedMethod = profile.methods.find(m => m.id === mapping.transformationMethod)}
											{#if selectedMethod && selectedMethod.parameters.length > 0}
												<div class="method-parameters">
													<label>Parameters:</label>
													{#each selectedMethod.parameters as param, index}
														<div class="parameter-row">
															<label>{param}:</label>
															<select 
																value={mapping.transformationParams?.[index] || ''}
																onchange={(e: Event) => {
																	if (!mapping.transformationParams) mapping.transformationParams = [];
																	mapping.transformationParams[index] = (e.target as HTMLSelectElement).value;
																	updateMapping(mapping.id, 'transformationParams', mapping.transformationParams);
																}}
															>
																<option value="">Select column...</option>
																{#if inputCsv}
																	{#each inputCsv.headers as header}
																		<option value="{`{${header}}`}">{header}</option>
																	{/each}
																{/if}
															</select>
														</div>
													{/each}
												</div>
											{/if}
										{/if}
									</div>
								{/if}

							</div>
						</div>

						<!-- Output Section -->
						<div class="output-section">
							<div class="section-content">
								<div class="preview-value">{getEffectiveTargetName(mapping)}</div>
								
								{#if mapping.isActive && mapping.sourceColumn}
									<div class="preview-value">
										{getOutputPreviewValue(mapping)}
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
			
			<div class="add-mapping-section">
				<wa-button onclick={addMapping} variant="primary">
					<wa-icon slot="prefix" name="plus"></wa-icon>
					Add Mapping
				</wa-button>
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
			onRowClick={(rowIndex) => selectedPreviewRow = rowIndex}
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
			onRowClick={(rowIndex) => selectedPreviewRow = rowIndex}
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

	.header-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.row-selector {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.row-selector label {
		font-size: 0.9rem;
		color: #666;
		white-space: nowrap;
	}

	.row-selector select {
		padding: 0.25rem 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.9rem;
		background: white;
	}

	.reorder-controls {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		gap: 0.25rem;
	}

	.add-mapping-section {
		margin: 1rem;
		padding: 1rem;
		display: flex;
		justify-content: center;
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
		grid-template-columns: 60px 1fr 2fr 1fr;
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
		grid-template-columns: 60px 1fr 2fr 1fr;
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
