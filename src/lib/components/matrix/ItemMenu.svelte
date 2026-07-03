<script lang="ts">
	import { getContext } from 'svelte';
	import type { MatrixStateType } from '$lib/matrix/matrix-state.svelte';

	let { id, onEdit, onDelete }: { id: string; onEdit: () => void; onDelete: () => void } = $props();

	const matrix = getContext<MatrixStateType>('matrix');

	let menuEl: HTMLDivElement | undefined = $state();

	$effect(() => {
		function onWindowClick(event: MouseEvent) {
			if (matrix.openMenuFor !== id) return;
			if (menuEl && event.target instanceof Node && menuEl.contains(event.target)) return;
			matrix.openMenuFor = null;
		}
		window.addEventListener('click', onWindowClick);
		return () => window.removeEventListener('click', onWindowClick);
	});

	function edit() {
		onEdit();
		matrix.openMenuFor = null;
	}

	function remove() {
		onDelete();
		matrix.openMenuFor = null;
	}
</script>

<div
	bind:this={menuEl}
	class="bg-white text-eh-text absolute top-full left-0 z-30 min-w-[140px] py-1 text-[13px] shadow-lg"
	style="box-shadow: 0 2px 8px oklch(0 0 0 / 0.15);"
>
	<button
		type="button"
		class="hover:bg-eh-grid flex w-full items-center gap-2 px-3 py-1.5 text-left"
		onclick={edit}
	>
		<span>✎</span>
		<span>Редагувати</span>
	</button>
	<button
		type="button"
		class="text-eh-danger hover:bg-eh-grid flex w-full items-center gap-2 px-3 py-1.5 text-left"
		onclick={remove}
	>
		<span>✕</span>
		<span>Видалити</span>
	</button>
</div>
