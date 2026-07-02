<script lang="ts">
	import { getContext } from 'svelte';
	import type { MatrixStateType } from '$lib/matrix/matrix-state.svelte';
	import { QUADRANT_META, otherQuadrants, type Quadrant } from '$lib/matrix/quadrants';
	import type { Task } from '$lib/server/db/schema';

	let { task }: { task: Task } = $props();

	const matrix = getContext<MatrixStateType>('matrix');

	let menuEl: HTMLDivElement | undefined = $state();

	const destinations = $derived(otherQuadrants(task.quadrant));

	function close() {
		matrix.openMenuFor = null;
	}

	function moveTo(quadrant: Quadrant) {
		matrix.moveTaskTo(task.id, quadrant);
		close();
	}

	function toggleFocus() {
		matrix.toggleFocus(task.id);
		close();
	}

	function toggleComplete() {
		matrix.toggleComplete(task.id);
		close();
	}

	function edit() {
		matrix.editingId = task.id;
		close();
	}

	function remove() {
		matrix.remove(task.id);
		close();
	}

	$effect(() => {
		function onWindowClick(event: MouseEvent) {
			// Another menu instance may have already claimed openMenuFor
			// during this same click's bubble phase — only act if we're
			// still the active menu.
			if (matrix.openMenuFor !== task.id) return;
			if (menuEl && event.target instanceof Node && menuEl.contains(event.target)) return;
			matrix.openMenuFor = null;
		}

		window.addEventListener('click', onWindowClick);
		return () => window.removeEventListener('click', onWindowClick);
	});
</script>

<div
	bind:this={menuEl}
	class="bg-white text-eh-text absolute top-full left-0 z-30 min-w-[168px] py-1 text-[13px] shadow-lg"
>
	{#each destinations as quadrant (quadrant)}
		<button
			type="button"
			class="hover:bg-eh-grid flex w-full items-center gap-2 px-3 py-1.5 text-left"
			onclick={() => moveTo(quadrant)}
		>
			<span>{QUADRANT_META[quadrant].arrow}</span>
			<span>{QUADRANT_META[quadrant].verb}</span>
		</button>
	{/each}

	<div class="bg-eh-grid my-1 h-px w-full"></div>

	<button
		type="button"
		class="hover:bg-eh-grid flex w-full items-center gap-2 px-3 py-1.5 text-left {task.starred
			? 'text-eh-text-muted'
			: 'text-eh-focus'}"
		onclick={toggleFocus}
	>
		<span>{task.starred ? '○' : '◎'}</span>
		<span>{task.starred ? 'Прибрати' : 'Фокус'}</span>
	</button>

	<button
		type="button"
		class="hover:bg-eh-grid flex w-full items-center gap-2 px-3 py-1.5 text-left {task.done
			? 'text-eh-text-muted'
			: 'text-eh-done'}"
		onclick={toggleComplete}
	>
		<span>{task.done ? '↺' : '✓'}</span>
		<span>{task.done ? 'Активна' : 'Готово'}</span>
	</button>

	<div class="bg-eh-grid my-1 h-px w-full"></div>

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
