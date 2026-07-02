<script lang="ts">
	import { getContext } from 'svelte';
	import type { MatrixStateType } from '$lib/matrix/matrix-state.svelte';
	import { clampSplit } from '$lib/matrix/layout';
	import QuadrantPane from './QuadrantPane.svelte';

	const matrix = getContext<MatrixStateType>('matrix');

	let gridEl: HTMLDivElement | undefined = $state();
	let dragMode: 'col' | 'row' | null = $state(null);

	function startColDrag(event: PointerEvent) {
		event.preventDefault();
		dragMode = 'col';
	}

	function startRowDrag(event: PointerEvent) {
		event.preventDefault();
		dragMode = 'row';
	}

	$effect(() => {
		if (!dragMode) return;

		function onPointerMove(event: PointerEvent) {
			if (!gridEl) return;
			const rect = gridEl.getBoundingClientRect();

			if (dragMode === 'col') {
				matrix.colSplit = clampSplit(((event.clientX - rect.left) / rect.width) * 100);
			} else if (dragMode === 'row') {
				matrix.rowSplit = clampSplit(((event.clientY - rect.top) / rect.height) * 100);
			}
		}

		function onPointerUp() {
			dragMode = null;
		}

		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerup', onPointerUp);

		return () => {
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerup', onPointerUp);
		};
	});
</script>

<div
	bind:this={gridEl}
	class="bg-eh-grid relative grid h-full w-full gap-px"
	style="grid-template-columns: {matrix.colSplit}% {100 - matrix.colSplit}%; grid-template-rows: {matrix.rowSplit}% {100 - matrix.rowSplit}%;"
>
	<QuadrantPane quadrantId="q1" />
	<QuadrantPane quadrantId="q2" />
	<QuadrantPane quadrantId="q3" />
	<QuadrantPane quadrantId="q4" />

	<button
		type="button"
		aria-label="Змінити ширину колонок"
		class="absolute top-0 z-10 h-full w-[9px] cursor-col-resize border-0 bg-transparent p-0"
		style="left: calc({matrix.colSplit}% - 4.5px);"
		onpointerdown={startColDrag}
	></button>

	<button
		type="button"
		aria-label="Змінити висоту рядків"
		class="absolute left-0 z-10 h-[9px] w-full cursor-row-resize border-0 bg-transparent p-0"
		style="top: calc({matrix.rowSplit}% - 4.5px);"
		onpointerdown={startRowDrag}
	></button>

	<div
		class="bg-eh-text-mutedest pointer-events-none absolute z-20 h-1.5 w-1.5 rounded-full"
		style="left: calc({matrix.colSplit}% - 3px); top: calc({matrix.rowSplit}% - 3px);"
	></div>

	<div
		class="bg-eh-statusbar text-eh-text-muted pointer-events-none absolute z-2 px-2 py-0.5 text-[12px] whitespace-nowrap"
		style="top: {matrix.rowSplit / 2}%; left: {matrix.colSplit}%; transform: translate(-50%, -50%) rotate(-90deg);"
	>
		важливо
	</div>
	<div
		class="bg-eh-statusbar text-eh-text-muted pointer-events-none absolute z-2 px-2 py-0.5 text-[12px] whitespace-nowrap"
		style="top: {(100 + matrix.rowSplit) / 2}%; left: {matrix.colSplit}%; transform: translate(-50%, -50%) rotate(-90deg);"
	>
		не важливо
	</div>
	<div
		class="bg-eh-statusbar text-eh-text-muted pointer-events-none absolute z-2 px-2 py-0.5 text-[12px] whitespace-nowrap"
		style="top: {matrix.rowSplit}%; left: {matrix.colSplit / 2}%; transform: translate(-50%, -50%);"
	>
		терміново
	</div>
	<div
		class="bg-eh-statusbar text-eh-text-muted pointer-events-none absolute z-2 px-2 py-0.5 text-[12px] whitespace-nowrap"
		style="top: {matrix.rowSplit}%; left: {(100 + matrix.colSplit) / 2}%; transform: translate(-50%, -50%);"
	>
		не терміново
	</div>
</div>
