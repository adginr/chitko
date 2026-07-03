<script lang="ts">
	import { getContext } from 'svelte';
	import type { MatrixStateType } from '$lib/matrix/matrix-state.svelte';
	import type { Vision } from '$lib/server/db/schema';
	import ItemMenu from './ItemMenu.svelte';

	let { item }: { item: Vision } = $props();

	const matrix = getContext<MatrixStateType>('matrix');

	let editBuffer = $state('');

	const isEditing = $derived(matrix.editingId === item.id);
	const isMenuOpen = $derived(matrix.openMenuFor === item.id);

	$effect(() => {
		if (isEditing) editBuffer = item.title;
	});

	function toggleMenu(event: MouseEvent) {
		event.stopPropagation();
		matrix.openMenuFor = isMenuOpen ? null : item.id;
	}

	function openNotes(event: MouseEvent) {
		event.stopPropagation();
		matrix.modalTarget = { kind: 'vision', id: item.id };
	}

	function commitEdit() {
		const title = editBuffer.trim();
		matrix.editingId = null;
		if (!title) return;
		matrix.renameVision(item.id, title);
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
	class="bg-eh-card hover:bg-[var(--color-eh-statusbar)] flex items-center gap-2 px-3 py-3"
	role="listitem"
>
	<div class="relative shrink-0">
		<button
			type="button"
			class="text-eh-text-muted flex h-[18px] w-[18px] items-center justify-center leading-none"
			aria-label="Меню"
			onclick={toggleMenu}
		>
			⋮
		</button>
		{#if isMenuOpen}
			<ItemMenu
				id={item.id}
				onEdit={() => (matrix.editingId = item.id)}
				onDelete={() => matrix.removeVision(item.id)}
			/>
		{/if}
	</div>

	<span class="shrink-0" style="color: var(--color-eh-q2);" aria-hidden="true">◦</span>

	{#if isEditing}
		<!-- svelte-ignore a11y_autofocus -->
		<input
			bind:value={editBuffer}
			type="text"
			class="text-eh-text min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-[16px] font-medium tracking-[-0.005em] outline-none"
			autofocus
			onkeydown={onEditKeydown}
			onblur={commitEdit}
		/>
	{:else}
		<button
			type="button"
			class="text-eh-text-strong min-w-0 flex-1 truncate text-left text-[16px] font-medium tracking-[-0.005em]"
			onclick={openNotes}
		>
			{item.title}
		</button>
	{/if}
</div>
