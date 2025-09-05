<script lang="ts">
	import type { Profile, Method } from '$lib/types';
	import { generateId } from '$lib/utils/storage';
	import { validateMethodCode } from '$lib/utils/transformation';

	interface Props {
		profile: Profile;
		onUpdate: () => void;
	}

	let { profile = $bindable(), onUpdate }: Props = $props();

	let selectedMethodId: string | null = $state(null);
	let editingMethod: Method | null = $state(null);
	let validationError: string | null = $state(null);

	function createMethod() {
		const newMethod: Method = {
			id: generateId(),
			name: 'newMethod',
			description: '',
			code: '(param1, param2) => {\n  // Your transformation logic here\n  return param1;\n}',
			parameters: ['param1', 'param2']
		};
		
		profile.methods = [...profile.methods, newMethod];
		selectedMethodId = newMethod.id;
		editingMethod = { ...newMethod };
		onUpdate();
	}

	function selectMethod(methodId: string) {
		if (editingMethod) {
			// Save current changes before switching
			saveMethod();
		}
		selectedMethodId = methodId;
		const method = profile.methods.find(m => m.id === methodId);
		editingMethod = method ? { ...method } : null;
		validationError = null;
	}

	function saveMethod() {
		if (!editingMethod) return;

		// Validate the method code
		const validation = validateMethodCode(editingMethod.code);
		if (!validation.isValid) {
			validationError = validation.error || 'Invalid method code';
			return;
		}

		// Update the method in the profile
		const index = profile.methods.findIndex(m => m.id === editingMethod!.id);
		if (index >= 0) {
			profile.methods[index] = { ...editingMethod };
			profile.methods = [...profile.methods];
			onUpdate();
		}

		validationError = null;
	}

	function deleteMethod(methodId: string) {
		const method = profile.methods.find(m => m.id === methodId);
		if (!method) return;

		if (confirm(`Are you sure you want to delete the method "${method.name}"?`)) {
			profile.methods = profile.methods.filter(m => m.id !== methodId);
			
			if (selectedMethodId === methodId) {
				selectedMethodId = null;
				editingMethod = null;
			}
			
			onUpdate();
		}
	}

	function addParameter() {
		if (!editingMethod) return;
		editingMethod.parameters = [...editingMethod.parameters, `param${editingMethod.parameters.length + 1}`];
	}

	function removeParameter(index: number) {
		if (!editingMethod) return;
		editingMethod.parameters = editingMethod.parameters.filter((_, i) => i !== index);
	}

	function updateParameter(index: number, value: string) {
		if (!editingMethod) return;
		editingMethod.parameters[index] = value;
		editingMethod.parameters = [...editingMethod.parameters];
	}

	// Example methods for reference
	const exampleMethods = [
		{
			name: 'convertCountryISOCodeToAccountNumber',
			description: 'Convert country ISO code to account number based on business type',
			code: '(countryCode, isBusiness) => {\n  const businessPrefix = isBusiness === "true" ? "B" : "P";\n  const countryMap = {\n    "US": "001",\n    "CA": "002",\n    "GB": "003",\n    "DE": "004",\n    "FR": "005"\n  };\n  return businessPrefix + (countryMap[countryCode] || "999");\n}',
			parameters: ['countryCode', 'isBusiness']
		},
		{
			name: 'formatFullName',
			description: 'Combine first and last name with proper formatting',
			code: '(firstName, lastName) => {\n  const first = (firstName || "").trim();\n  const last = (lastName || "").trim();\n  return [first, last].filter(Boolean).join(" ");\n}',
			parameters: ['firstName', 'lastName']
		},
		{
			name: 'parseDate',
			description: 'Convert date string to ISO format',
			code: '(dateString) => {\n  if (!dateString) return "";\n  const date = new Date(dateString);\n  return isNaN(date.getTime()) ? dateString : date.toISOString().split("T")[0];\n}',
			parameters: ['dateString']
		}
	];

	function loadExampleMethod(example: typeof exampleMethods[0]) {
		const newMethod: Method = {
			id: generateId(),
			name: example.name,
			description: example.description,
			code: example.code,
			parameters: [...example.parameters]
		};
		
		profile.methods = [...profile.methods, newMethod];
		selectedMethodId = newMethod.id;
		editingMethod = { ...newMethod };
		onUpdate();
	}
</script>

<div class="methods-view">
	<div class="methods-header">
		<h3>Custom Methods</h3>
		<div class="header-actions">
			<button onclick={createMethod} class="create-method-btn">Add Method</button>
		</div>
	</div>

	<div class="methods-layout">
		<!-- Methods List -->
		<div class="methods-sidebar">
			<h4>Available Methods</h4>
			
			{#if profile.methods.length === 0}
				<div class="empty-methods">
					<p>No methods defined</p>
				</div>
			{:else}
				<div class="methods-list">
					{#each profile.methods as method}
						<div 
							class="method-item {selectedMethodId === method.id ? 'selected' : ''}"
							onclick={() => selectMethod(method.id)}
						>
							<div class="method-name">{method.name}</div>
							<div class="method-params">({method.parameters.join(', ')})</div>
							<button 
								onclick={(e) => { e.stopPropagation(); deleteMethod(method.id); }}
								class="delete-method-btn"
								title="Delete method"
							>
								×
							</button>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Example Methods -->
			<div class="example-methods">
				<h5>Example Methods</h5>
				<p class="example-note">Click to add to your profile:</p>
				{#each exampleMethods as example}
					<button 
						onclick={() => loadExampleMethod(example)}
						class="example-method-btn"
						title={example.description}
					>
						{example.name}
					</button>
				{/each}
			</div>
		</div>

		<!-- Method Editor -->
		<div class="method-editor">
			{#if editingMethod}
				<div class="editor-content">
					<div class="method-info">
						<div class="form-group">
							<label for="method-name">Method Name:</label>
							<input 
								id="method-name"
								type="text" 
								bind:value={editingMethod.name}
								placeholder="Enter method name"
							/>
						</div>

						<div class="form-group">
							<label for="method-description">Description:</label>
							<input 
								id="method-description"
								type="text" 
								bind:value={editingMethod.description}
								placeholder="Describe what this method does"
							/>
						</div>

						<div class="form-group">
							<label>Parameters:</label>
							<div class="parameters-list">
								{#each editingMethod.parameters as param, index}
									<div class="parameter-item">
										<input 
											type="text" 
											value={param}
											onchange={(e) => updateParameter(index, (e.target as HTMLInputElement).value)}
											placeholder="Parameter name"
										/>
										<button 
											onclick={() => removeParameter(index)}
											class="remove-param-btn"
											title="Remove parameter"
										>
											×
										</button>
									</div>
								{/each}
								<button onclick={addParameter} class="add-param-btn">+ Add Parameter</button>
							</div>
						</div>
					</div>

					<div class="code-editor">
						<label for="method-code">JavaScript Function:</label>
						<textarea 
							id="method-code"
							bind:value={editingMethod.code}
							placeholder="Enter your JavaScript function code here..."
							rows="15"
						></textarea>
						
						{#if validationError}
							<div class="validation-error">
								<strong>Error:</strong> {validationError}
							</div>
						{/if}

						<div class="code-help">
							<h6>Tips:</h6>
							<ul>
								<li>Write your function as an arrow function or regular function</li>
								<li>Parameters are passed in the order defined above</li>
								<li>Always return a value (string, number, etc.)</li>
								<li>Use standard JavaScript - no external libraries</li>
								<li>Example: <code>(param1, param2) => param1 + param2</code></li>
							</ul>
						</div>
					</div>

					<div class="editor-actions">
						<button onclick={saveMethod} class="save-method-btn">Save Method</button>
					</div>
				</div>
			{:else}
				<div class="no-method-selected">
					<p>Select a method from the list to edit, or create a new one.</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.methods-view {
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: 1rem;
	}

	.methods-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.methods-header h3 {
		margin: 0;
		color: #333;
	}

	.create-method-btn {
		background: #007bff;
		color: white;
		border: 1px solid #007bff;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
	}

	.create-method-btn:hover {
		background: #0056b3;
	}

	.methods-layout {
		display: grid;
		grid-template-columns: 300px 1fr;
		gap: 2rem;
		flex: 1;
		min-height: 600px;
	}

	.methods-sidebar {
		background: white;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.methods-sidebar h4 {
		margin: 0;
		color: #333;
		font-size: 1.1rem;
	}

	.empty-methods {
		text-align: center;
		color: #666;
		font-style: italic;
		padding: 2rem 0;
	}

	.methods-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.method-item {
		padding: 0.75rem;
		border: 1px solid #dee2e6;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
	}

	.method-item:hover {
		background: #f8f9fa;
		border-color: #007bff;
	}

	.method-item.selected {
		background: #e3f2fd;
		border-color: #007bff;
	}

	.method-name {
		font-weight: 500;
		color: #333;
		margin-bottom: 0.25rem;
	}

	.method-params {
		font-size: 0.85rem;
		color: #666;
		font-family: monospace;
	}

	.delete-method-btn {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: #dc3545;
		color: white;
		border: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		cursor: pointer;
		font-size: 12px;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.delete-method-btn:hover {
		background: #c82333;
	}

	.example-methods {
		border-top: 1px solid #dee2e6;
		padding-top: 1rem;
		margin-top: auto;
	}

	.example-methods h5 {
		margin: 0 0 0.5rem 0;
		color: #333;
		font-size: 0.9rem;
	}

	.example-note {
		font-size: 0.8rem;
		color: #666;
		margin: 0 0 0.5rem 0;
	}

	.example-method-btn {
		display: block;
		width: 100%;
		padding: 0.5rem;
		margin-bottom: 0.25rem;
		background: #f8f9fa;
		border: 1px solid #dee2e6;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.85rem;
		text-align: left;
	}

	.example-method-btn:hover {
		background: #e9ecef;
	}

	.method-editor {
		background: white;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
	}

	.no-method-selected {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #666;
		font-style: italic;
	}

	.editor-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		height: 100%;
	}

	.method-info {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-weight: 500;
		color: #333;
	}

	.form-group input {
		padding: 0.5rem;
		border: 1px solid #ced4da;
		border-radius: 4px;
	}

	.parameters-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.parameter-item {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.parameter-item input {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #ced4da;
		border-radius: 4px;
	}

	.remove-param-btn {
		background: #dc3545;
		color: white;
		border: none;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		cursor: pointer;
		font-size: 14px;
		line-height: 1;
	}

	.add-param-btn {
		background: #28a745;
		color: white;
		border: 1px solid #28a745;
		padding: 0.5rem;
		border-radius: 4px;
		cursor: pointer;
		align-self: flex-start;
	}

	.code-editor {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.code-editor label {
		font-weight: 500;
		color: #333;
	}

	.code-editor textarea {
		flex: 1;
		padding: 1rem;
		border: 1px solid #ced4da;
		border-radius: 4px;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.9rem;
		resize: vertical;
		min-height: 300px;
	}

	.validation-error {
		background: #f8d7da;
		color: #721c24;
		padding: 0.75rem;
		border-radius: 4px;
		border: 1px solid #f5c6cb;
	}

	.code-help {
		background: #f8f9fa;
		padding: 1rem;
		border-radius: 4px;
		border: 1px solid #e9ecef;
	}

	.code-help h6 {
		margin: 0 0 0.5rem 0;
		color: #333;
	}

	.code-help ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.code-help li {
		margin-bottom: 0.25rem;
		font-size: 0.9rem;
		color: #666;
	}

	.code-help code {
		background: #e9ecef;
		padding: 0.125rem 0.25rem;
		border-radius: 2px;
		font-family: monospace;
	}

	.editor-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.save-method-btn {
		background: #28a745;
		color: white;
		border: 1px solid #28a745;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
	}

	.save-method-btn:hover {
		background: #218838;
	}
</style>
