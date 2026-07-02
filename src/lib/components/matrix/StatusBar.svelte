<script lang="ts">
	import { getContext } from 'svelte';
	import type { MatrixStateType } from '$lib/matrix/matrix-state.svelte';
	import AddTaskPicker from './AddTaskPicker.svelte';
	import FocusListDropdown from './FocusListDropdown.svelte';
	import DoneListDropdown from './DoneListDropdown.svelte';

	const matrix = getContext<MatrixStateType>('matrix');

	function toggleAddPicker(event: MouseEvent) {
		event.stopPropagation();
		matrix.addPickerOpen = !matrix.addPickerOpen;
	}

	function toggleFocusMode(event: MouseEvent) {
		event.stopPropagation();
		matrix.focusMode = !matrix.focusMode;
	}

	function toggleFocusList(event: MouseEvent) {
		event.stopPropagation();
		matrix.focusListOpen = !matrix.focusListOpen;
	}

	function toggleDoneList(event: MouseEvent) {
		event.stopPropagation();
		matrix.doneListOpen = !matrix.doneListOpen;
	}
</script>

<div
	class="bg-eh-statusbar text-eh-text-muted flex items-center text-xs"
	style="padding: 6px clamp(14px, 2vw, 24px);"
>
	<div class="relative">
		<button
			type="button"
			class="text-eh-text flex h-[18px] w-[18px] items-center justify-center text-base leading-none"
			aria-label="Додати завдання"
			onclick={toggleAddPicker}
		>
			+
		</button>
		{#if matrix.addPickerOpen}
			<AddTaskPicker />
		{/if}
	</div>

	<div class="flex-1"></div>

	<div class="flex items-center gap-3">
		<div class="flex items-center gap-1.5">
			<button
				type="button"
				class="text-eh-star flex h-[18px] w-[18px] items-center justify-center text-base leading-none"
				aria-label={matrix.focusMode ? 'Вимкнути режим фокусу' : 'Увімкнути режим фокусу'}
				onclick={toggleFocusMode}
			>
				{matrix.focusMode ? '★' : '☆'}
			</button>
			<div class="relative">
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
		</div>

		<div class="flex items-center gap-1.5">
			<span
				class="text-eh-text-muted flex h-[18px] w-[18px] items-center justify-center text-base leading-none"
			>
				✓
			</span>
			<div class="relative">
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
		</div>
	</div>
</div>
