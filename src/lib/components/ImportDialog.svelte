<script lang="ts">
	import type { CsvData, CsvParseOptions } from '$lib/types';
	import { parseCsvFromFile, detectDelimiter, detectHeaders, DEFAULT_CSV_OPTIONS } from '$lib/utils/csv';
	import Preview from './Preview.svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		onImport: (data: CsvData) => void;
	}

	let { isOpen, onClose, onImport }: Props = $props();

	let fileInput: HTMLInputElement;
	let csvText = $state('');
	let parseOptions: CsvParseOptions = $state({ ...DEFAULT_CSV_OPTIONS });
	let previewData: CsvData | null = $state(null);
	let fileName = $state('');
	let parseError = $state('');
	let isLoading = $state(false);
	let error = $state('');

	async function handleFileSelect(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;

		fileName = file.name;
		try {
			isLoading = true;
			error = '';
			
			// First read the file as text to auto-detect options
			const text = await file.text();
			autoDetectOptions(text);
			
			// Then parse with detected options
			previewData = await parseCsvFromFile(file, parseOptions);
			isLoading = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to process file';
			isLoading = false;
		}
	}

	function autoDetectOptions(text: string) {
		const detectedDelimiter = detectDelimiter(text);
		const hasHeaders = detectHeaders(text, detectedDelimiter);

		parseOptions = {
			...parseOptions,
			delimiter: detectedDelimiter,
			hasHeader: hasHeaders
		};

	}

	function updatePreview() {
		if (!fileName) {
			previewData = null;
			return;
		}

		// Re-parse the file with updated options
		const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
		const file = fileInput?.files?.[0];
		if (file) {
			handleFileSelect({ target: fileInput } as any);
		}
	}

	function handleImport() {
		if (previewData) {
			onImport(previewData);
			handleClose();
		}
	}

	function handleClose() {
		csvText = '';
		fileName = '';
		previewData = null;
		parseError = '';
		parseOptions = { ...DEFAULT_CSV_OPTIONS };
		onClose();
	}

	// Update preview when options change
	$effect(() => {
		if (csvText) {
			updatePreview();
		}
	});

	function getDelimiterDisplay(delimiter: string): string {
		switch (delimiter) {
			case ',': return 'Comma (,)';
			case ';': return 'Semicolon (;)';
			case '\t': return 'Tab';
			case '|': return 'Pipe (|)';
			default: return delimiter;
		}
	}
</script>

{#if isOpen}
	<div class="dialog-overlay" onclick={handleClose}>
		<div class="dialog" onclick={(e) => e.stopPropagation()}>
			<div class="dialog-header">
				<h2>Import CSV File</h2>
				<button onclick={handleClose} class="close-btn">×</button>
			</div>

			<div class="dialog-content">
				{#if !fileName}
					<div class="file-upload">
						<input 
							type="file" 
							accept=".csv,.txt" 
							bind:this={fileInput}
							onchange={handleFileSelect}
							style="display: none;"
						/>
						<button onclick={() => fileInput?.click()} class="upload-btn">
							Choose CSV File
						</button>
						<p class="upload-help">Select a CSV file to import and configure parsing options</p>
					</div>
				{:else}
					<div class="import-content">
						<div class="file-info">
							<strong>File:</strong> {fileName}
							<button onclick={() => { fileName = ''; previewData = null; }} class="change-file-btn">
								Change File
							</button>
						</div>

						<div class="parse-options">
							<h3>Parsing Options</h3>
							
							<div class="option-grid">
								<div class="option-group">
									<label for="delimiter">Delimiter:</label>
									<select id="delimiter" bind:value={parseOptions.delimiter} onchange={updatePreview}>
										<option value=",">Comma (,)</option>
										<option value=";">Semicolon (;)</option>
										<option value="\t">Tab</option>
										<option value="|">Pipe (|)</option>
									</select>
								</div>

								<div class="option-group">
									<label for="quote">Quote Character:</label>
									<input 
										id="quote" 
										type="text" 
										bind:value={parseOptions.quote}
										maxlength="1"
										placeholder='"'
										oninput={updatePreview}
									/>
								</div>

								<div class="option-group">
									<label for="escape">Escape Character:</label>
									<input 
										id="escape" 
										type="text" 
										bind:value={parseOptions.escape}
										maxlength="1"
										placeholder='"'
										oninput={updatePreview}
									/>
								</div>

								<div class="option-group">
									<label>
										<input 
											type="checkbox" 
											checked={parseOptions.hasHeader === true}
											onchange={(e) => {
												parseOptions.hasHeader = (e.target as HTMLInputElement).checked;
												updatePreview();
											}}
										/>
										First row contains headers
									</label>
								</div>

								<div class="option-group">
									<label>
										<input 
											type="checkbox" 
											bind:checked={parseOptions.skipEmptyLines}
											onchange={updatePreview}
										/>
										Skip empty lines
									</label>
								</div>

								<div class="option-group">
									<label>
										<input 
											type="checkbox" 
											bind:checked={parseOptions.trim}
											onchange={updatePreview}
										/>
										Trim whitespace from values
									</label>
								</div>
							</div>
						</div>

						{#if parseError}
							<div class="parse-error">
								<strong>Parse Error:</strong> {parseError}
							</div>
						{/if}

						{#if previewData && previewData.headers.length > 0}
							<Preview 
								data={previewData} 
								title="Preview"
								showLineNumbers={true}
								hasHeaders={parseOptions.hasHeader}
							/>
						{/if}
					</div>
				{/if}
			</div>

			<div class="dialog-footer">
				<button onclick={handleClose} class="cancel-btn">Cancel</button>
				{#if previewData && previewData.headers.length > 0}
					<button onclick={handleImport} class="import-btn">Import Data</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.dialog-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.dialog {
		background: white;
		border-radius: 8px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		max-width: 90vw;
		max-height: 90vh;
		width: 800px;
		display: flex;
		flex-direction: column;
	}

	.dialog-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #dee2e6;
	}

	.dialog-header h2 {
		margin: 0;
		color: #333;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #666;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
	}

	.close-btn:hover {
		background: #f8f9fa;
	}

	.dialog-content {
		flex: 1;
		padding: 1.5rem;
		overflow-y: auto;
	}

	.file-upload {
		text-align: center;
		padding: 3rem 2rem;
	}

	.upload-btn {
		background: #007bff;
		color: white;
		border: 1px solid #007bff;
		padding: 1rem 2rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		margin-bottom: 1rem;
	}

	.upload-btn:hover {
		background: #0056b3;
	}

	.upload-help {
		color: #666;
		margin: 0;
	}

	.import-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.file-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 4px;
	}

	.change-file-btn {
		background: #6c757d;
		color: white;
		border: 1px solid #6c757d;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
	}

	.parse-options h3 {
		margin: 0 0 1rem 0;
		color: #333;
	}

	.option-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.option-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.option-group label {
		font-weight: 500;
		color: #333;
	}

	.option-group input[type="checkbox"] {
		margin-right: 0.5rem;
	}

	.option-group input, .option-group select {
		padding: 0.5rem;
		border: 1px solid #ced4da;
		border-radius: 4px;
	}

	.parse-error {
		background: #f8d7da;
		color: #721c24;
		padding: 1rem;
		border-radius: 4px;
		border: 1px solid #f5c6cb;
	}

	.preview-section h3 {
		margin: 0 0 1rem 0;
		color: #333;
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		flex-wrap: wrap;
		gap: 1rem;
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

	.preview-table-container {
		border: 1px solid #dee2e6;
		border-radius: 4px;
		overflow: auto;
		max-height: 300px;
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

	.preview-note {
		margin: 0.5rem 0 0 0;
		color: #6c757d;
		font-size: 0.85rem;
		font-style: italic;
	}

	.dialog-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		padding: 1.5rem;
		border-top: 1px solid #dee2e6;
	}

	.cancel-btn {
		background: #6c757d;
		color: white;
		border: 1px solid #6c757d;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
	}

	.import-btn {
		background: #28a745;
		color: white;
		border: 1px solid #28a745;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
	}

	.import-btn:hover {
		background: #218838;
	}

	@media (max-width: 768px) {
		.dialog {
			width: 95vw;
			margin: 1rem;
		}

		.option-grid {
			grid-template-columns: 1fr;
		}

		.preview-table th,
		.preview-table td {
			max-width: 100px;
		}
	}
</style>
