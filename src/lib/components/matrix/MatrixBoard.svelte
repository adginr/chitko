<script lang="ts">
	import { setContext } from 'svelte';
	import { createMatrixState } from '$lib/matrix/matrix-state.svelte';
	import MatrixGrid from './MatrixGrid.svelte';
	import StatusBar from './StatusBar.svelte';
	import NotesModal from './NotesModal.svelte';

	const matrix = createMatrixState();
	setContext('matrix', matrix);
</script>

<div class="flex h-screen w-screen flex-col overflow-hidden">
	<div class="min-h-0 flex-1">
		<MatrixGrid />
	</div>
	<StatusBar />
</div>

<NotesModal />
