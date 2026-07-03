<script lang="ts">
	import { getContext } from 'svelte';
	import type { MatrixStateType } from '$lib/matrix/matrix-state.svelte';
	import MatrixGrid from './MatrixGrid.svelte';
	import AddTaskPicker from './AddTaskPicker.svelte';

	const matrix = getContext<MatrixStateType>('matrix');

	function toggleAddPicker(event: MouseEvent) {
		event.stopPropagation();
		matrix.addPickerOpen = !matrix.addPickerOpen;
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex h-7 shrink-0 items-center justify-end px-3">
		<div class="relative">
			<button
				type="button"
				class="text-eh-text-muted hover:text-eh-text hover:border-eh-text-muted flex h-4 w-4 items-center justify-center border text-[13px] leading-none"
				style="border-color: var(--color-eh-outline);"
				aria-label="Додати завдання"
				onclick={toggleAddPicker}
			>
				+
			</button>
			{#if matrix.addPickerOpen}
				<AddTaskPicker />
			{/if}
		</div>
	</div>
	<div class="min-h-0 flex-1">
		<MatrixGrid />
	</div>
</div>
