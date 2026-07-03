<script lang="ts">
	import { getContext } from 'svelte';
	import type { MatrixStateType } from '$lib/matrix/matrix-state.svelte';
	import { QUADRANTS, QUADRANT_META, type Quadrant } from '$lib/matrix/quadrants';

	const matrix = getContext<MatrixStateType>('matrix');

	let panelEl: HTMLDivElement | undefined = $state();

	function pick(quadrant: Quadrant) {
		matrix.addingTo = quadrant;
		matrix.addPickerOpen = false;
	}

	$effect(() => {
		function onWindowClick(event: MouseEvent) {
			if (panelEl && event.target instanceof Node && panelEl.contains(event.target)) return;
			matrix.addPickerOpen = false;
		}

		window.addEventListener('click', onWindowClick);
		return () => window.removeEventListener('click', onWindowClick);
	});
</script>

<div
	bind:this={panelEl}
	class="bg-white text-eh-text absolute top-full right-0 z-30 mt-1 min-w-[176px] py-1 text-[13px] shadow-lg"
	style="box-shadow: 0 2px 8px oklch(0 0 0 / 0.15);"
>
	{#each QUADRANTS as quadrant (quadrant)}
		<button
			type="button"
			class="hover:bg-eh-grid flex w-full items-center gap-2 px-3 py-1.5 text-left"
			onclick={() => pick(quadrant)}
		>
			<span>{QUADRANT_META[quadrant].arrow}</span>
			<span>{QUADRANT_META[quadrant].label}</span>
		</button>
	{/each}
</div>
