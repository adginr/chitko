<script lang="ts">
	import { getContext } from 'svelte';
	import type { MatrixStateType } from '$lib/matrix/matrix-state.svelte';
	import { QUADRANT_META, type Quadrant } from '$lib/matrix/quadrants';
	import TaskCard from './TaskCard.svelte';

	let { quadrantId }: { quadrantId: Quadrant } = $props();

	const matrix = getContext<MatrixStateType>('matrix');

	const meta = $derived(QUADRANT_META[quadrantId]);
	const tasks = $derived(matrix.byQuadrant[quadrantId]);
	const isHoverTarget = $derived(
		matrix.hoverQuadrant === quadrantId && matrix.dragFromQuadrant !== quadrantId
	);
	const paneStyle = $derived(
		`opacity: ${meta.opacity};` +
			(isHoverTarget ? ` background-color: oklch(0.955 0.012 ${meta.hue});` : '')
	);

	let newTitle = $state('');
	let inputEl: HTMLInputElement | undefined = $state();

	$effect(() => {
		if (matrix.addingTo === quadrantId) {
			inputEl?.focus();
		}
	});

	function submitAdd() {
		const title = newTitle.trim();
		if (!title) {
			cancelAdd();
			return;
		}
		matrix.addTask(quadrantId, title);
		newTitle = '';
		matrix.addingTo = null;
	}

	function cancelAdd() {
		newTitle = '';
		matrix.addingTo = null;
	}

	function onAddKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			submitAdd();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			cancelAdd();
		}
	}

	function onAddBlur() {
		if (!newTitle.trim()) cancelAdd();
	}

	function onDragOver(event: DragEvent) {
		event.preventDefault();
		matrix.hoverQuadrant = quadrantId;
	}

	function onDragLeave(event: DragEvent) {
		const related = event.relatedTarget;
		const container = event.currentTarget;
		if (related instanceof Node && container instanceof Node && container.contains(related)) {
			return;
		}
		if (matrix.hoverQuadrant === quadrantId) matrix.hoverQuadrant = null;
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		const id = matrix.dragTaskId;
		if (id) matrix.moveTaskTo(id, quadrantId);
		matrix.hoverQuadrant = null;
		matrix.dragTaskId = null;
		matrix.dragFromQuadrant = null;
	}
</script>

<div
	class="bg-eh-card flex min-h-0 flex-col overflow-y-auto p-2"
	style={paneStyle}
	role="group"
	aria-label={meta.label}
	ondragover={onDragOver}
	ondragleave={onDragLeave}
	ondrop={onDrop}
>
	{#if tasks.length === 0 && matrix.addingTo !== quadrantId}
		<div
			class="text-eh-text-mutedest flex flex-1 items-center justify-center border border-dashed border-current text-center text-sm"
			style="border-radius: 10px;"
		>
			Перетягніть сюди завдання
		</div>
	{:else}
		<div class="flex flex-col gap-1">
			{#each tasks as task (task.id)}
				<TaskCard {task} />
			{/each}
		</div>
	{/if}

	{#if matrix.addingTo === quadrantId}
		<input
			bind:this={inputEl}
			bind:value={newTitle}
			type="text"
			placeholder="нове завдання"
			class="text-eh-text mt-1 w-full border-0 bg-transparent px-1 py-1 text-sm outline-none"
			onkeydown={onAddKeydown}
			onblur={onAddBlur}
		/>
	{/if}
</div>
