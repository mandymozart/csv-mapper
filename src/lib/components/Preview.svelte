<script lang="ts">
	import type { CsvData } from '$lib/types';

	interface Props {
		data: CsvData;
		title?: string;
		showLineNumbers?: boolean;
		hasHeaders?: boolean;
		defaultStartRow?: number;
		defaultRowCount?: number;
		collapsible?: boolean;
		defaultCollapsed?: boolean;
		onRowClick?: (rowIndex: number) => void;
	}

	let { 
		data, 
		title = "Data Preview", 
		showLineNumbers = true, 
		hasHeaders = false,
		defaultStartRow = 1,
		defaultRowCount = 5,
		collapsible = false,
		defaultCollapsed = false,
		onRowClick
	}: Props = $props();

	let previewStartRow = $state(defaultStartRow);
	let previewRowCount = $state(defaultRowCount);
	let isCollapsed = $state(defaultCollapsed);

	// Update start row when hasHeaders changes
	$effect(() => {
		if (hasHeaders !== undefined) {
			previewStartRow = hasHeaders ? 2 : 1;
		}
	});

	// Calculate display values
	let maxRow = $derived(data.rows.length + (hasHeaders ? 1 : 0));
	let minRow = $derived(hasHeaders ? 2 : 1);
	let startIndex = $derived(previewStartRow - (hasHeaders ? 2 : 1));
	let endIndex = $derived(startIndex + previewRowCount);
	let displayRows = $derived(data.rows.slice(startIndex, endIndex));

	function toggleCollapse() {
		isCollapsed = !isCollapsed;
	}

	function handleRowClick(rowIndex: number) {
		if (onRowClick) {
			// Convert display index to actual data index (0-based)
			const actualRowIndex = startIndex + rowIndex;
			onRowClick(actualRowIndex);
		}
	}
</script>

<div class="preview">
	<div class="preview-header">
		<div class="header-left">
			<h4>{title} ({data.rows.length} rows)</h4>
			{#if collapsible}
				<wa-button variant="text" size="small" onclick={toggleCollapse}>
				<wa-icon name={isCollapsed ? 'chevron-right' : 'chevron-down'}></wa-icon>
			</wa-button>
			{/if}
		</div>
		{#if !isCollapsed}
			<div class="preview-controls">
			<div class="row-selector">
				<label for="startRow">Start row:</label>
				<wa-input 
				id="startRow"
				type="number" 
				value={previewStartRow}
				min={minRow}
				max={maxRow}
				oninput={(e: Event) => previewStartRow = parseInt((e.target as HTMLInputElement).value)}
			></wa-input>
			</div>
			<div class="row-selector">
				<label for="rowCount">Show:</label>
				<select id="rowCount" value={previewRowCount} onchange={(e: Event) => previewRowCount = parseInt((e.target as HTMLSelectElement).value)}>
				<option value={1}>1 row</option>
				<option value={5}>5 rows</option>
				<option value={10}>10 rows</option>
				<option value={20}>20 rows</option>
				<option value={50}>50 rows</option>
			</select>
			</div>
			</div>
		{/if}
	</div>
	
	{#if !isCollapsed}
		<div class="table-container">
			<table class="preview-table">
				<thead>
					<tr>
						{#if showLineNumbers}
							<th class="line-number-header">#</th>
						{/if}
						{#each data.headers as header}
							<th>{header}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each displayRows as row, index}
						<tr class="data-row {onRowClick ? 'clickable' : ''}" onclick={() => handleRowClick(index)}>
							{#if showLineNumbers}
								<td class="line-number">{previewStartRow + index}</td>
							{/if}
							{#each data.headers as header}
								<td>{row[header] || ''}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		
		<p class="preview-note">
			Showing rows {previewStartRow}-{Math.min(previewStartRow + previewRowCount - 1, maxRow)} of {maxRow} total
		</p>
	{/if}
</div>

<style>
	.preview {
		background: white;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		padding: 1rem;
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.preview-header h4 {
		margin: 0;
		color: #333;
	}

	.collapse-btn {
		background: none;
		border: none;
		font-size: 1rem;
		cursor: pointer;
		padding: 0.25rem;
		color: #666;
		transition: color 0.2s;
	}

	.collapse-btn:hover {
		color: #333;
	}

	.preview-controls {
		display: flex;
		gap: 1rem;
		align-items: center;
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

	.row-input {
		width: 80px;
		padding: 0.25rem 0.5rem;
		border: 1px solid #ced4da;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	.row-select {
		padding: 0.25rem 0.5rem;
		border: 1px solid #ced4da;
		border-radius: 4px;
		font-size: 0.9rem;
		background: white;
	}

	.table-container {
		border: 1px solid #dee2e6;
		border-radius: 4px;
		overflow: auto;
		max-height: 300px;
		margin-top: 1rem;
	}

	.preview-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	.preview-table th,
	.preview-table td {
		padding: 0.5rem;
		text-align: left;
		border-bottom: 1px solid #dee2e6;
		border-right: 1px solid #dee2e6;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 150px;
	}

	.line-number-header,
	.line-number {
		width: 60px;
		min-width: 60px;
		max-width: 60px;
		text-align: center;
		background: #f8f9fa;
		font-weight: 600;
		color: #6c757d;
		font-size: 0.85rem;
	}

	.line-number-header {
		position: sticky;
		top: 0;
		z-index: 1;
	}

	.preview-table th {
		background: #f8f9fa;
		font-weight: 600;
		color: #495057;
		position: sticky;
		top: 0;
	}

	.preview-table td:last-child,
	.preview-table th:last-child {
		border-right: none;
	}

	.preview-table tbody tr:last-child td {
		border-bottom: none;
	}

	.preview-table tbody tr:hover {
		background: #f8f9fa;
	}

	.data-row.clickable {
		cursor: pointer;
	}

	.data-row.clickable:hover {
		background: #e3f2fd !important;
	}

	.preview-note {
		margin: 0.5rem 0 0 0;
		color: #6c757d;
		font-size: 0.85rem;
		font-style: italic;
	}

	@media (max-width: 768px) {
		.preview-controls {
			flex-direction: column;
			align-items: stretch;
		}

		.preview-table th,
		.preview-table td {
			max-width: 100px;
		}
	}
</style>
