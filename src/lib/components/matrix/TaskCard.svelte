<script lang="ts">
	import { getContext } from 'svelte';
	import type { MatrixStateType } from '$lib/matrix/matrix-state.svelte';
	import type { Task } from '$lib/server/db/schema';
	import TaskMenu from './TaskMenu.svelte';

	let { task }: { task: Task } = $props();

	const matrix = getContext<MatrixStateType>('matrix');

	let editBuffer = $state('');

	const isDragging = $derived(matrix.dragTaskId === task.id);
	const isEditing = $derived(matrix.editingId === task.id);
	const isMenuOpen = $derived(matrix.openMenuFor === task.id);
	const project = $derived(matrix.projectById(task.projectId));
	// Focus mode declutters the grid: everything not starred fades right back.
	const dimmed = $derived(matrix.focusMode && !task.starred);

	$effect(() => {
		if (isEditing) editBuffer = task.title;
	});

	function toggleMenu(event: MouseEvent) {
		event.stopPropagation();
		matrix.openMenuFor = isMenuOpen ? null : task.id;
	}

	function openNotes(event: MouseEvent) {
		event.stopPropagation();
		matrix.modalTarget = { kind: 'task', id: task.id };
	}

	function commitEdit() {
		const title = editBuffer.trim();
		matrix.editingId = null;
		if (!title) return;
		matrix.rename(task.id, title);
	}

	function cancelEdit() {
		editBuffer = task.title;
		matrix.editingId = null;
	}

	function onEditKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			commitEdit();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			cancelEdit();
		}
	}

	function onDragStart(event: DragEvent) {
		matrix.dragTaskId = task.id;
		matrix.dragFromQuadrant = task.quadrant;
		event.dataTransfer?.setData('text/plain', task.id);
	}

	function onDragEnd() {
		matrix.dragTaskId = null;
		matrix.dragFromQuadrant = null;
	}
</script>

<div
	class="flex items-center gap-1.5 px-1 py-1 text-sm font-normal"
	style="opacity: {isDragging ? 0.35 : dimmed ? 0.1 : 1}; transition: opacity 150ms ease;"
	role="listitem"
	draggable="true"
	ondragstart={onDragStart}
	ondragend={onDragEnd}
>
	<div class="relative shrink-0">
		<button
			type="button"
			class="text-eh-text-muted flex h-[18px] w-[18px] items-center justify-center leading-none"
			aria-label="Меню завдання"
			onclick={toggleMenu}
		>
			⋮
		</button>
		{#if isMenuOpen}
			<TaskMenu {task} />
		{/if}
	</div>

	{#if isEditing}
		<input
			bind:value={editBuffer}
			type="text"
			class="text-eh-text min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm outline-none"
			onkeydown={onEditKeydown}
			onblur={commitEdit}
		/>
	{:else}
		<button
			type="button"
			class="text-eh-text-strong min-w-0 flex-1 truncate text-left text-sm"
			onclick={openNotes}
		>
			{task.title}
		</button>
	{/if}

	{#if project}
		<span
			class="max-w-[100px] shrink-0 truncate rounded-[10px] px-1.5 py-0.5 text-[10px]"
			style="color: var(--color-eh-tag-text); background: var(--color-eh-tag-bg);"
			title={project.title}
		>
			{project.title}
		</span>
	{/if}

	{#if task.starred}
		<span class="text-eh-star shrink-0 text-sm">★</span>
	{/if}
</div>
