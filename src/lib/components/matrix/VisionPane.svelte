<script lang="ts">
	import { getContext } from 'svelte';
	import type { MatrixStateType } from '$lib/matrix/matrix-state.svelte';
	import VisionRow from './VisionRow.svelte';

	const matrix = getContext<MatrixStateType>('matrix');

	let draft = $state('');
	let inputEl: HTMLInputElement | undefined = $state();

	const items = $derived(matrix.visions);

	$effect(() => {
		if (matrix.addingVision) inputEl?.focus();
	});

	function startAdd() {
		matrix.addingVision = true;
	}

	function submitAdd() {
		const title = draft.trim();
		if (!title) {
			cancelAdd();
			return;
		}
		matrix.addVision(title);
		draft = '';
		matrix.addingVision = false;
	}

	function cancelAdd() {
		draft = '';
		matrix.addingVision = false;
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			submitAdd();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			cancelAdd();
		}
	}

	function onBlur() {
		if (!draft.trim()) cancelAdd();
	}
</script>

<div class="bg-eh-card flex h-full flex-col overflow-y-auto">
	<div class="flex h-7 shrink-0 items-center justify-between px-3">
		<span class="text-eh-text-mutedest text-[11px]">{items.length}</span>
		<button
			type="button"
			class="text-eh-text-muted hover:text-eh-text hover:border-eh-text-muted flex h-4 w-4 items-center justify-center border text-[13px] leading-none"
			style="border-color: var(--color-eh-outline);"
			aria-label="Додати бачення"
			onclick={startAdd}
		>
			+
		</button>
	</div>

	{#if items.length === 0 && !matrix.addingVision}
		<div
			class="text-eh-text-mutedest flex flex-1 items-center justify-center px-6 text-center text-sm"
		>
			Додайте бачення — на що ми орієнтуємось
		</div>
	{:else}
		<div class="flex flex-col" role="list">
			{#each items as item (item.id)}
				<VisionRow {item} />
			{/each}
		</div>
	{/if}

	{#if matrix.addingVision}
		<input
			bind:this={inputEl}
			bind:value={draft}
			type="text"
			placeholder="нове бачення"
			class="text-eh-text w-full border-0 bg-transparent px-3 py-3 text-[16px] font-medium tracking-[-0.005em] outline-none"
			onkeydown={onKeydown}
			onblur={onBlur}
		/>
	{/if}
</div>
