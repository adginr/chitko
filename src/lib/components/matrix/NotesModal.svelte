<script lang="ts">
	import { getContext } from 'svelte';
	import { marked } from 'marked';
	import type { MatrixStateType } from '$lib/matrix/matrix-state.svelte';

	const matrix = getContext<MatrixStateType>('matrix');

	const task = $derived(matrix.tasks.find((t) => t.id === matrix.modalTaskId) ?? null);

	let titleBuffer = $state('');
	let noteBuffer = $state('');
	let previewing = $state(false);
	let panelEl: HTMLDivElement | undefined = $state();
	let lastTaskId: string | null = null;

	$effect(() => {
		if (task && task.id !== lastTaskId) {
			titleBuffer = task.title;
			noteBuffer = task.notes;
			previewing = false;
			lastTaskId = task.id;
		} else if (!task) {
			lastTaskId = null;
		}
	});

	$effect(() => {
		if (!task) return;

		function onWindowClick(event: MouseEvent) {
			if (panelEl && event.target instanceof Node && panelEl.contains(event.target)) return;
			closeModal();
		}

		window.addEventListener('click', onWindowClick);
		return () => window.removeEventListener('click', onWindowClick);
	});

	const previewHtml = $derived(marked.parse(noteBuffer, { async: false }));

	function commitTitle() {
		if (!task) return;
		const title = titleBuffer.trim();
		if (title && title !== task.title) matrix.rename(task.id, title);
	}

	function onTitleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			(event.currentTarget as HTMLInputElement).blur();
		}
	}

	function closeModal() {
		if (task) {
			commitTitle();
			matrix.saveNotes(task.id, noteBuffer);
		}
		matrix.modalTaskId = null;
	}
</script>

{#if task}
	<div
		class="fixed inset-0 z-40 flex items-center justify-center"
		style="background-color: oklch(0 0 0 / 0.35);"
	>
		<div
			bind:this={panelEl}
			class="bg-eh-card text-eh-text flex flex-col"
			style="width: min(640px, 90vw); height: min(70vh, 560px);"
		>
			<div class="border-eh-grid flex items-center gap-2 border-b px-4 py-3">
				<input
					bind:value={titleBuffer}
					type="text"
					class="text-eh-text-strong min-w-0 flex-1 border-0 bg-transparent text-[15px] font-semibold outline-none"
					onblur={commitTitle}
					onkeydown={onTitleKeydown}
				/>
				<button
					type="button"
					class="text-eh-text-muted shrink-0 text-xs"
					onclick={() => (previewing = !previewing)}
				>
					{previewing ? 'Редагувати' : 'Перегляд'}
				</button>
				<button
					type="button"
					class="text-eh-text-muted shrink-0 text-base leading-none"
					aria-label="Закрити"
					onclick={closeModal}
				>
					✕
				</button>
			</div>

			<div class="min-h-0 flex-1 overflow-y-auto p-4">
				{#if previewing}
					<div class="prose prose-sm max-w-none text-sm leading-relaxed">
						{@html previewHtml}
					</div>
				{:else}
					<textarea
						bind:value={noteBuffer}
						placeholder="Нотатки у форматі Markdown: **жирний**, *курсив*, # заголовок, - список"
						class="h-full w-full resize-none border-0 bg-transparent font-mono text-[13.5px] outline-none"
					></textarea>
				{/if}
			</div>
		</div>
	</div>
{/if}
