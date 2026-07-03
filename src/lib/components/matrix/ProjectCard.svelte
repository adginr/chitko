<script lang="ts">
	import { getContext } from 'svelte';
	import type { MatrixStateType } from '$lib/matrix/matrix-state.svelte';
	import type { Project } from '$lib/server/db/schema';
	import ItemMenu from './ItemMenu.svelte';

	let { item }: { item: Project } = $props();

	const matrix = getContext<MatrixStateType>('matrix');

	let editBuffer = $state('');

	const isEditing = $derived(matrix.editingId === item.id);
	const isMenuOpen = $derived(matrix.openMenuFor === item.id);
	const linkedCount = $derived(matrix.projectTaskCounts[item.id] ?? 0);

	$effect(() => {
		if (isEditing) editBuffer = item.title;
	});

	function toggleMenu(event: MouseEvent) {
		event.stopPropagation();
		matrix.openMenuFor = isMenuOpen ? null : item.id;
	}

	function openNotes(event: MouseEvent) {
		event.stopPropagation();
		matrix.modalTarget = { kind: 'project', id: item.id };
	}

	function commitEdit() {
		const title = editBuffer.trim();
		matrix.editingId = null;
		if (!title) return;
		matrix.renameProject(item.id, title);
	}

	function cancelEdit() {
		editBuffer = item.title;
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
</script>

<div
	class="eh-project-card flex flex-col rounded-lg bg-white p-4"
	style="min-height: 110px; border: 1px solid var(--color-eh-grid); box-shadow: 0 1px 2px oklch(0 0 0 / 0.04);"
>
	<div class="flex items-start justify-between">
		<span style="color: var(--color-eh-q2);" aria-hidden="true">→</span>
		<div class="relative shrink-0">
			<button
				type="button"
				class="text-eh-text-muted flex h-[18px] w-[18px] items-center justify-center leading-none"
				aria-label="Меню проєкту"
				onclick={toggleMenu}
			>
				⋮
			</button>
			{#if isMenuOpen}
				<ItemMenu
					id={item.id}
					onEdit={() => (matrix.editingId = item.id)}
					onDelete={() => matrix.removeProject(item.id)}
				/>
			{/if}
		</div>
	</div>

	{#if isEditing}
		<!-- svelte-ignore a11y_autofocus -->
		<input
			bind:value={editBuffer}
			type="text"
			class="text-eh-text mt-1 min-w-0 border-0 bg-transparent px-0 py-0 text-[16px] font-medium outline-none"
			autofocus
			onkeydown={onEditKeydown}
			onblur={commitEdit}
		/>
	{:else}
		<button
			type="button"
			class="text-eh-text-strong mt-1 text-left text-[16px] font-medium tracking-[-0.005em]"
			onclick={openNotes}
		>
			{item.title}
		</button>
	{/if}

	{#if linkedCount > 0}
		<span
			class="text-eh-text-muted mt-auto self-start rounded-[10px] px-2 py-0.5 text-[10px]"
			style="background: var(--color-eh-grid);"
		>
			{linkedCount} завдань
		</span>
	{/if}
</div>

<style>
	.eh-project-card {
		transition:
			border-color 150ms ease,
			box-shadow 150ms ease,
			transform 150ms ease;
	}
	.eh-project-card:hover {
		border-color: oklch(0.82 0.006 80) !important;
		box-shadow: 0 4px 12px oklch(0 0 0 / 0.08) !important;
		transform: translateY(-1px);
	}
</style>
