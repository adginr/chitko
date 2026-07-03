<script lang="ts">
	import { setContext } from 'svelte';
	import { createMatrixState } from '$lib/matrix/matrix-state.svelte';
	import Sidebar from './Sidebar.svelte';
	import TacticalPane from './TacticalPane.svelte';
	import VisionPane from './VisionPane.svelte';
	import ProjectsPane from './ProjectsPane.svelte';
	import NotesModal from './NotesModal.svelte';

	const matrix = createMatrixState();
	setContext('matrix', matrix);
</script>

<div class="bg-eh-grid flex h-screen w-screen gap-px overflow-hidden">
	<Sidebar />
	<div class="min-h-0 min-w-0 flex-1">
		{#if matrix.expandedLevel === 'vision'}
			<VisionPane />
		{:else if matrix.expandedLevel === 'projects'}
			<ProjectsPane />
		{:else}
			<TacticalPane />
		{/if}
	</div>
</div>

<NotesModal />
