<script lang="ts">
	import { getContext } from 'svelte';
	import { marked } from 'marked';
	import type { MatrixStateType } from '$lib/matrix/matrix-state.svelte';

	const matrix = getContext<MatrixStateType>('matrix');

	// The modal is shared by tasks, projects and vision items — all of which
	// expose { id, title, notes, updatedAt }. Resolve the active item by kind.
	const target = $derived(matrix.modalTarget);
	const item = $derived.by(() => {
		const t = matrix.modalTarget;
		if (!t) return null;
		if (t.kind === 'task') return matrix.tasks.find((x) => x.id === t.id) ?? null;
		if (t.kind === 'project') return matrix.projects.find((x) => x.id === t.id) ?? null;
		return matrix.visions.find((x) => x.id === t.id) ?? null;
	});

	function saveItemNotes(id: string, notes: string) {
		const kind = target?.kind;
		if (kind === 'project') matrix.saveProjectNotes(id, notes);
		else if (kind === 'vision') matrix.saveVisionNotes(id, notes);
		else matrix.saveNotes(id, notes);
	}

	function renameItem(id: string, title: string) {
		const kind = target?.kind;
		if (kind === 'project') matrix.renameProject(id, title);
		else if (kind === 'vision') matrix.renameVision(id, title);
		else matrix.rename(id, title);
	}

	let titleBuffer = $state('');
	let noteBuffer = $state('');
	let previewing = $state(false);
	let saveStatus = $state<'saved' | 'saving'>('saved');
	let panelEl: HTMLDivElement | undefined = $state();
	let lastId: string | null = null;
	let saveTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		if (item && item.id !== lastId) {
			clearTimeout(saveTimer);
			titleBuffer = item.title;
			noteBuffer = item.notes;
			previewing = false;
			saveStatus = 'saved';
			lastId = item.id;
		} else if (!item) {
			lastId = null;
		}
	});

	function pad(n: number): string {
		return String(n).padStart(2, '0');
	}

	function formatUpdatedAt(date: Date): string {
		const d = `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${pad(date.getFullYear() % 100)}`;
		const t = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
		return `${d} ${t}`;
	}

	function scheduleSave() {
		if (!item) return;
		const id = item.id;
		saveStatus = 'saving';
		clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			saveItemNotes(id, noteBuffer);
			saveStatus = 'saved';
		}, 500);
	}

	$effect(() => {
		if (!item) return;

		function onWindowClick(event: MouseEvent) {
			if (panelEl && event.target instanceof Node && panelEl.contains(event.target)) return;
			closeModal();
		}

		window.addEventListener('click', onWindowClick);
		return () => window.removeEventListener('click', onWindowClick);
	});

	const previewHtml = $derived(marked.parse(noteBuffer, { async: false }));

	function commitTitle() {
		if (!item) return;
		const title = titleBuffer.trim();
		if (title && title !== item.title) renameItem(item.id, title);
	}

	function onTitleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			(event.currentTarget as HTMLInputElement).blur();
		}
	}

	function closeModal() {
		clearTimeout(saveTimer);
		if (item) {
			commitTitle();
			saveItemNotes(item.id, noteBuffer);
		}
		matrix.modalTarget = null;
	}
</script>

{#if item}
	<div
		class="fixed inset-0 z-40 flex items-center justify-center"
		style="background-color: oklch(0 0 0 / 0.35);"
	>
		<div
			bind:this={panelEl}
			class="bg-eh-card text-eh-text relative flex flex-col"
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
						oninput={scheduleSave}
						placeholder="Нотатки у форматі Markdown: **жирний**, *курсив*, # заголовок, - список"
						class="h-full w-full resize-none border-0 bg-transparent font-mono text-[13.5px] outline-none"
					></textarea>
				{/if}
			</div>

			<div
				class="text-eh-text-mutedest pointer-events-none absolute right-3.5 bottom-2.5 flex items-center gap-1.5 text-[11px]"
			>
				<span>{formatUpdatedAt(item.updatedAt)}</span>
				{#if saveStatus === 'saving'}
					<svg
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="animate-spin"
						aria-label="Збереження"
					>
						<path d="M21 12a9 9 0 1 1-3-6.7"></path>
						<path d="M21 3v6h-6"></path>
					</svg>
				{:else}
					<svg
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-label="Збережено"
					>
						<path
							d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
						></path>
						<path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path>
						<path d="M7 3v4a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V3.4"></path>
					</svg>
				{/if}
			</div>
		</div>
	</div>
{/if}
