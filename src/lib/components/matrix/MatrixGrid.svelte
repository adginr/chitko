<script lang="ts">
	import { getContext } from 'svelte';
	import type { MatrixStateType } from '$lib/matrix/matrix-state.svelte';
	import { clampSplit } from '$lib/matrix/layout';
	import QuadrantPane from './QuadrantPane.svelte';

	const matrix = getContext<MatrixStateType>('matrix');

	let gridEl: HTMLDivElement | undefined = $state();
	let dragMode: 'col' | 'row' | 'both' | null = $state(null);

	function startColDrag(event: PointerEvent) {
		event.preventDefault();
		dragMode = 'col';
	}

	function startRowDrag(event: PointerEvent) {
		event.preventDefault();
		dragMode = 'row';
	}

	function startBothDrag(event: PointerEvent) {
		event.preventDefault();
		dragMode = 'both';
	}

	$effect(() => {
		if (!dragMode) return;

		function onPointerMove(event: PointerEvent) {
			if (!gridEl) return;
			const rect = gridEl.getBoundingClientRect();

			if (dragMode === 'col' || dragMode === 'both') {
				matrix.colSplit = clampSplit(((event.clientX - rect.left) / rect.width) * 100);
			}
			if (dragMode === 'row' || dragMode === 'both') {
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

	<button
		type="button"
		aria-label="Змінити пропорції по обох осях"
		class="group absolute z-20 flex h-5 w-5 cursor-move items-center justify-center border-0 bg-transparent p-0"
		style="left: calc({matrix.colSplit}% - 10px); top: calc({matrix.rowSplit}% - 10px);"
		onpointerdown={startBothDrag}
	>
		<span
			class="bg-eh-text-mutedest group-hover:bg-eh-text-muted h-1.5 w-1.5 rounded-full transition-[background-color,transform] group-hover:scale-150"
		></span>
	</button>

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
