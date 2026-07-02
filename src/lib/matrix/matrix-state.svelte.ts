import {
	listTasks,
	createTask,
	moveTask,
	renameTask,
	toggleStar,
	toggleDone,
	deleteTask,
	updateNotes
} from '$lib/remote/tasks.remote';
import { browser } from '$app/environment';
import { QUADRANTS, type Quadrant } from '$lib/matrix/quadrants';
import { clampSplit } from '$lib/matrix/layout';
import type { Task } from '$lib/server/db/schema';

const SPLIT_STORAGE_KEY = 'chitko:matrix-split';

/**
 * Per-request reactive state for the Eisenhower matrix. Must be created fresh
 * inside a component (never module-level, since the app is SSR'd) and shared
 * via context.
 */
class MatrixState {
	#tasksQuery = listTasks();

	// Ephemeral UI state
	dragTaskId = $state<string | null>(null);
	dragFromQuadrant = $state<Quadrant | null>(null);
	hoverQuadrant = $state<Quadrant | null>(null);
	openMenuFor = $state<string | null>(null);
	editingId = $state<string | null>(null);
	addingTo = $state<Quadrant | null>(null);
	modalTaskId = $state<string | null>(null);
	focusMode = $state(false);
	focusListOpen = $state(false);
	doneListOpen = $state(false);
	addPickerOpen = $state(false);
	colSplit = $state(50);
	rowSplit = $state(50);

	constructor() {
		if (!browser) return;

		// Читання збереженого стану resize
		try {
			const raw = localStorage.getItem(SPLIT_STORAGE_KEY);
			if (raw) {
				const saved = JSON.parse(raw) as { colSplit?: number; rowSplit?: number };
				if (typeof saved.colSplit === 'number') this.colSplit = clampSplit(saved.colSplit);
				if (typeof saved.rowSplit === 'number') this.rowSplit = clampSplit(saved.rowSplit);
			}
		} catch {
			// зіпсований запис — ігноруємо, лишаємо дефолт 50/50
		}

		// Реактивний запис при кожній зміні split
		$effect(() => {
			localStorage.setItem(
				SPLIT_STORAGE_KEY,
				JSON.stringify({ colSplit: this.colSplit, rowSplit: this.rowSplit })
			);
		});
	}

	tasks = $derived(this.#tasksQuery.current ?? []);

	byQuadrant = $derived.by(() => {
		const grouped: Record<Quadrant, Task[]> = { q1: [], q2: [], q3: [], q4: [] };
		for (const task of this.tasks) {
			if (task.done) continue;
			grouped[task.quadrant].push(task);
		}
		for (const quadrant of QUADRANTS) {
			grouped[quadrant].sort((a, b) => a.position - b.position);
		}
		return grouped;
	});

	starredTasks = $derived(this.tasks.filter((task) => task.starred && !task.done));
	doneTasks = $derived(this.tasks.filter((task) => task.done));

	async addTask(quadrant: Quadrant, title: string) {
		const trimmed = title.trim();
		if (!trimmed) return;

		const optimistic: Task = {
			// crypto.randomUUID() requires a secure context (HTTPS or localhost)
			// and is unavailable over plain http:// on a LAN IP — this id is only
			// a temporary client-side placeholder until the server assigns the
			// real one, so it doesn't need cryptographic randomness.
			id: `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`,
			title: trimmed,
			quadrant,
			position: Date.now(),
			starred: false,
			done: false,
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date()
		};

		try {
			await createTask({ quadrant, title: trimmed }).updates(
				this.#tasksQuery.withOverride((current) => [...current, optimistic])
			);
		} catch {
			void this.#tasksQuery.refresh();
		}
	}

	async moveTaskTo(id: string, quadrant: Quadrant) {
		const task = this.tasks.find((t) => t.id === id);
		if (!task || task.quadrant === quadrant) return;

		try {
			await moveTask({ id, quadrant }).updates(
				this.#tasksQuery.withOverride((current) =>
					current.map((t) => (t.id === id ? { ...t, quadrant, position: Date.now() } : t))
				)
			);
		} catch {
			void this.#tasksQuery.refresh();
		}
	}

	async rename(id: string, title: string) {
		const trimmed = title.trim();
		if (!trimmed) return;

		try {
			await renameTask({ id, title: trimmed }).updates(
				this.#tasksQuery.withOverride((current) =>
					current.map((t) => (t.id === id ? { ...t, title: trimmed } : t))
				)
			);
		} catch {
			void this.#tasksQuery.refresh();
		}
	}

	async toggleFocus(id: string) {
		try {
			await toggleStar({ id }).updates(
				this.#tasksQuery.withOverride((current) =>
					current.map((t) => (t.id === id ? { ...t, starred: !t.starred } : t))
				)
			);
		} catch {
			void this.#tasksQuery.refresh();
		}
	}

	async toggleComplete(id: string) {
		try {
			await toggleDone({ id }).updates(
				this.#tasksQuery.withOverride((current) =>
					current.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
				)
			);
		} catch {
			void this.#tasksQuery.refresh();
		}
	}

	async remove(id: string) {
		try {
			await deleteTask({ id }).updates(
				this.#tasksQuery.withOverride((current) => current.filter((t) => t.id !== id))
			);
		} catch {
			void this.#tasksQuery.refresh();
		}
	}

	async saveNotes(id: string, notes: string) {
		try {
			await updateNotes({ id, notes }).updates(
				this.#tasksQuery.withOverride((current) =>
					current.map((t) => (t.id === id ? { ...t, notes, updatedAt: new Date() } : t))
				)
			);
		} catch {
			void this.#tasksQuery.refresh();
		}
	}
}

export function createMatrixState() {
	return new MatrixState();
}

export type MatrixStateType = ReturnType<typeof createMatrixState>;
