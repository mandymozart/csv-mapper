<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>CSV Mapper - Transform Your Data</title>
</svelte:head>

{@render children?.()}

<style>
	:global(html) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		line-height: 1.6;
		color: #333;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		background: #f5f5f5;
		min-height: 100vh;
	}

	:global(*) {
		box-sizing: border-box;
	}

	:global(button) {
		font-family: inherit;
		transition: all 0.2s ease;
	}

	:global(button:focus) {
		outline: 2px solid #007bff;
		outline-offset: 2px;
	}

	:global(input:focus, select:focus, textarea:focus) {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
	}

	:global(.sr-only) {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* Responsive breakpoints */
	@media (max-width: 768px) {
		:global(.methods-layout) {
			grid-template-columns: 1fr !important;
		}

		:global(.mappings-grid .grid-header),
		:global(.mappings-grid .mapping-row) {
			grid-template-columns: 1fr !important;
		}

		:global(.header) {
			flex-direction: column !important;
			align-items: stretch !important;
		}

		:global(.profile-section) {
			min-width: auto !important;
		}
	}

	@media (max-width: 480px) {
		:global(.main-content) {
			padding: 1rem !important;
		}

		:global(.header) {
			padding: 1rem !important;
		}
	}
</style>
