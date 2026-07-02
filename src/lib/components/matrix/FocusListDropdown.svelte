<script lang="ts">
	import { getContext } from 'svelte';
	import type { MatrixStateType } from '$lib/matrix/matrix-state.svelte';

	const matrix = getContext<MatrixStateType>('matrix');

	let panelEl: HTMLDivElement | undefined = $state();

	function unstar(id: string) {
		matrix.toggleFocus(id);
	}

	$effect(() => {
		function onWindowClick(event: MouseEvent) {
			if (panelEl && event.target instanceof Node && panelEl.contains(event.target)) return;
			matrix.focusListOpen = false;
		}

		window.addEventListener('click', onWindowClick);
		return () => window.removeEventListener('click', onWindowClick);
	});
</script>

<div
	bind:this={panelEl}
	class="bg-white text-eh-text absolute right-0 bottom-full z-30 mb-1 min-w-[200px] py-1 text-[13px] shadow-lg"
>
	{#if matrix.starredTasks.length === 0}
		<p class="text-eh-text-mutedest px-3 py-1.5">Немає завдань у фокусі</p>
	{:else}
		{#each matrix.starredTasks as task (task.id)}
			<button
				type="button"
				class="hover:bg-eh-grid flex w-full items-center gap-2 px-3 py-1.5 text-left"
				onclick={() => unstar(task.id)}
			>
				<span class="text-eh-star">★</span>
				<span class="truncate">{task.title}</span>
			</button>
		{/each}
	{/if}
</div>
