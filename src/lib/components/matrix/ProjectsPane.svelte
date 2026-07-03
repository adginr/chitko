<script lang="ts">
	import { getContext } from 'svelte';
	import type { MatrixStateType } from '$lib/matrix/matrix-state.svelte';
	import ProjectCard from './ProjectCard.svelte';

	const matrix = getContext<MatrixStateType>('matrix');

	let draft = $state('');
	let inputEl: HTMLInputElement | undefined = $state();

	const items = $derived(matrix.projects);

	$effect(() => {
		if (matrix.addingProject) inputEl?.focus();
	});

	function startAdd() {
		matrix.addingProject = true;
	}

	function submitAdd() {
		const title = draft.trim();
		if (!title) {
			cancelAdd();
			return;
		}
		matrix.addProject(title);
		draft = '';
		matrix.addingProject = false;
	}

	function cancelAdd() {
		draft = '';
		matrix.addingProject = false;
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
			aria-label="Додати проєкт"
			onclick={startAdd}
		>
			+
		</button>
	</div>

	{#if items.length === 0 && !matrix.addingProject}
		<div
			class="text-eh-text-mutedest flex flex-1 items-center justify-center px-6 text-center text-sm"
		>
			Додайте проєкт — тактичні задачі можна прив'язати до нього
		</div>
	{:else}
		<div
			class="grid gap-3 p-4"
			style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));"
		>
			{#if matrix.addingProject}
				<div
					class="flex flex-col rounded-lg bg-white p-4"
					style="min-height: 110px; border: 1px solid var(--color-eh-grid);"
				>
					<input
						bind:this={inputEl}
						bind:value={draft}
						type="text"
						placeholder="новий проєкт"
						class="text-eh-text w-full border-0 bg-transparent px-0 py-0 text-[16px] font-medium outline-none"
						onkeydown={onKeydown}
						onblur={onBlur}
					/>
				</div>
			{/if}
			{#each items as item (item.id)}
				<ProjectCard {item} />
			{/each}
		</div>
	{/if}
</div>
