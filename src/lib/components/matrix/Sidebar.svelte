<script lang="ts">
	import { getContext } from 'svelte';
	import type { MatrixStateType, Level } from '$lib/matrix/matrix-state.svelte';
	import FocusListDropdown from './FocusListDropdown.svelte';
	import DoneListDropdown from './DoneListDropdown.svelte';

	const matrix = getContext<MatrixStateType>('matrix');

	const tabs: { level: Level; label: string; accent: string }[] = [
		{ level: 'vision', label: 'Стратегічний', accent: 'var(--color-eh-q2)' },
		{ level: 'projects', label: 'Оперативний', accent: 'var(--color-eh-q3)' },
		{ level: 'tactic', label: 'Тактичний', accent: 'var(--color-eh-tactic)' }
	];

	const collapsed = $derived(matrix.sidebarCollapsed);

	function select(level: Level) {
		matrix.expandedLevel = level;
	}

	function toggleFocusMode(event: MouseEvent) {
		event.stopPropagation();
		matrix.focusMode = !matrix.focusMode;
	}

	function toggleFocusList(event: MouseEvent) {
		event.stopPropagation();
		matrix.focusListOpen = !matrix.focusListOpen;
		matrix.doneListOpen = false;
	}

	function toggleDoneList(event: MouseEvent) {
		event.stopPropagation();
		matrix.doneListOpen = !matrix.doneListOpen;
		matrix.focusListOpen = false;
	}
</script>

<aside
	class="bg-eh-statusbar flex shrink-0 flex-col overflow-visible transition-[width] duration-200 ease-out"
	style="width: var(--eh-sidebar-width, 150px); padding: {collapsed ? '6px 0' : '6px 0 6px 6px'};"
>
	{#each tabs as tab (tab.level)}
		{@const active = matrix.expandedLevel === tab.level}
		<button
			type="button"
			class="flex items-center gap-2 rounded-l-sm text-left transition-colors duration-150 hover:bg-[var(--color-eh-hover)]"
			style="padding: {collapsed ? '10px 0' : '10px 14px'}; justify-content: {collapsed
				? 'center'
				: 'flex-start'}; background: {active
				? 'var(--color-eh-active)'
				: 'transparent'}; color: {active
				? 'var(--color-eh-tactic)'
				: 'var(--color-eh-text-muted)'}; border-left: 2px solid {active
				? tab.accent
				: 'transparent'};"
			title={collapsed ? tab.label : undefined}
			onclick={() => select(tab.level)}
		>
			<svg
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="shrink-0"
				aria-hidden="true"
			>
				{#if tab.level === 'vision'}
					<circle cx="12" cy="12" r="10" />
					<polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
				{:else if tab.level === 'projects'}
					<path d="M12 13v8" />
					<path d="M12 3v3" />
					<path
						d="M4 6a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h13a2 2 0 0 0 1.152-.367l3.424-2.4a1 1 0 0 0 0-1.666l-3.424-2.4A2 2 0 0 0 17 6z"
					/>
				{:else}
					<rect width="18" height="18" x="3" y="3" rx="2" />
					<path d="M3 12h18" />
					<path d="M12 3v18" />
				{/if}
			</svg>
			{#if !collapsed}
				<span class="text-[10px] font-medium tracking-[0.06em] uppercase">{tab.label}</span>
			{/if}
		</button>
	{/each}

	<div
		class="my-1 h-px"
		style="background: var(--color-eh-divider); margin-left: {collapsed
			? '4px'
			: '8px'}; margin-right: 8px;"
	></div>

	<!-- Focus row -->
	<div
		class="relative flex items-center gap-1.5 text-[12px]"
		style="padding: {collapsed ? '6px 0' : '6px 14px'}; justify-content: {collapsed
			? 'center'
			: 'flex-start'};"
	>
		<button
			type="button"
			class="flex h-[18px] w-[18px] items-center justify-center text-base leading-none"
			style="color: {matrix.focusMode ? 'var(--color-eh-star)' : 'var(--color-eh-text-muted)'};"
			aria-label={matrix.focusMode ? 'Вимкнути режим фокусу' : 'Увімкнути режим фокусу'}
			onclick={toggleFocusMode}
		>
			{matrix.focusMode ? '★' : '☆'}
		</button>
		{#if !collapsed}
			<button
				type="button"
				class="text-eh-text-muted flex-1 text-left"
				aria-label="Список завдань у фокусі"
				onclick={toggleFocusList}
			>
				Фокус
			</button>
		{/if}
		<button
			type="button"
			class="text-eh-text-muted"
			aria-label="Список завдань у фокусі"
			onclick={toggleFocusList}
		>
			{matrix.starredTasks.length}
		</button>
		{#if matrix.focusListOpen}
			<FocusListDropdown />
		{/if}
	</div>

	<!-- Done row -->
	<div
		class="relative flex items-center gap-1.5 text-[12px]"
		style="padding: {collapsed ? '6px 0' : '6px 14px'}; justify-content: {collapsed
			? 'center'
			: 'flex-start'};"
	>
		<span
			class="text-eh-text-muted flex h-[18px] w-[18px] items-center justify-center text-base leading-none"
			aria-hidden="true"
		>
			✓
		</span>
		{#if !collapsed}
			<button
				type="button"
				class="text-eh-text-muted flex-1 text-left"
				aria-label="Список виконаних завдань"
				onclick={toggleDoneList}
			>
				Готово
			</button>
		{/if}
		<button
			type="button"
			class="text-eh-text-muted"
			aria-label="Список виконаних завдань"
			onclick={toggleDoneList}
		>
			{matrix.doneTasks.length}
		</button>
		{#if matrix.doneListOpen}
			<DoneListDropdown />
		{/if}
	</div>

	<!-- Collapse toggle -->
	<button
		type="button"
		class="text-eh-text-muted hover:bg-[var(--color-eh-hover)] mt-auto flex items-center text-sm leading-none transition-colors duration-150"
		style="padding: {collapsed ? '10px 0' : '10px 14px'}; justify-content: {collapsed
			? 'center'
			: 'flex-start'};"
		aria-label={collapsed ? 'Розгорнути панель' : 'Згорнути панель'}
		title={collapsed ? 'Розгорнути' : 'Згорнути'}
		onclick={() => (matrix.sidebarCollapsed = !matrix.sidebarCollapsed)}
	>
		{collapsed ? '»' : '«'}
	</button>
</aside>
