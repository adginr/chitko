import {
	listTasks,
	createTask,
	moveTask,
	renameTask,
	toggleStar,
	toggleDone,
	deleteTask,
	updateNotes,
	assignProject
} from '$lib/remote/tasks.remote';
import {
	listProjects,
	createProject,
	renameProject,
	updateProjectNotes,
	deleteProject
} from '$lib/remote/projects.remote';
import {
	listVisions,
	createVision,
	renameVision,
	updateVisionNotes,
	deleteVision
} from '$lib/remote/vision.remote';
import { browser } from '$app/environment';
import { QUADRANTS, type Quadrant } from '$lib/matrix/quadrants';
import { clampSplit } from '$lib/matrix/layout';
import type { Task, Project, Vision } from '$lib/server/db/schema';

const SPLIT_STORAGE_KEY = 'chitko:matrix-split';
const LAYOUT_STORAGE_KEY = 'chitko:layout';

/** The three nested planning levels; only one pane is mounted at a time. */
export type Level = 'vision' | 'projects' | 'tactic';

/** What the shared detail modal is currently editing. */
export type ModalTarget = { kind: 'task' | 'vision' | 'project'; id: string };

function newOptimisticId(): string {
	// crypto.randomUUID() requires a secure context (HTTPS or localhost) and is
	// unavailable over plain http:// on a LAN IP — this id is only a temporary
	// client-side placeholder until the server assigns the real one, so it
	// doesn't need cryptographic randomness.
	return `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Per-request reactive state for the whole app (Vision / Projects / Tactical
 * matrix). Must be created fresh inside a component (never module-level, since
 * the app is SSR'd) and shared via context.
 */
class MatrixState {
	#tasksQuery = listTasks();
	#projectsQuery = listProjects();
	#visionsQuery = listVisions();

	// Navigation / layout
	expandedLevel = $state<Level>('tactic');
	sidebarCollapsed = $state(false);

	// Ephemeral UI state (ids are UUIDs, unique across tables — so editingId /
	// openMenuFor are safely shared by task, vision and project rows).
	dragTaskId = $state<string | null>(null);
	dragFromQuadrant = $state<Quadrant | null>(null);
	hoverQuadrant = $state<Quadrant | null>(null);
	openMenuFor = $state<string | null>(null);
	editingId = $state<string | null>(null);
	addingTo = $state<Quadrant | null>(null);
	addingVision = $state(false);
	addingProject = $state(false);
	modalTarget = $state<ModalTarget | null>(null);
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

		// Читання збереженого рівня / стану сайдбару
		try {
			const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
			if (raw) {
				const saved = JSON.parse(raw) as { expandedLevel?: Level; sidebarCollapsed?: boolean };
				if (
					saved.expandedLevel === 'vision' ||
					saved.expandedLevel === 'projects' ||
					saved.expandedLevel === 'tactic'
				) {
					this.expandedLevel = saved.expandedLevel;
				}
				if (typeof saved.sidebarCollapsed === 'boolean') {
					this.sidebarCollapsed = saved.sidebarCollapsed;
				}
			}
		} catch {
			// зіпсований запис — ігноруємо
		}

		// Реактивний запис при кожній зміні split — у localStorage і в CSS-змінні,
		// з яких рендериться сітка (див. блокуючий скрипт у app.html, що задає їх
		// до першого малювання, щоб не було стрибка з дефолтних 50/50).
		$effect(() => {
			localStorage.setItem(
				SPLIT_STORAGE_KEY,
				JSON.stringify({ colSplit: this.colSplit, rowSplit: this.rowSplit })
			);
			const root = document.documentElement;
			root.style.setProperty('--eh-col-split', `${this.colSplit}%`);
			root.style.setProperty('--eh-row-split', `${this.rowSplit}%`);
		});

		// Те саме для рівня/сайдбару — --eh-sidebar-width теж задається pre-paint
		// у app.html, тож ширина рейки не стрибає при завантаженні.
		$effect(() => {
			localStorage.setItem(
				LAYOUT_STORAGE_KEY,
				JSON.stringify({
					expandedLevel: this.expandedLevel,
					sidebarCollapsed: this.sidebarCollapsed
				})
			);
			document.documentElement.style.setProperty(
				'--eh-sidebar-width',
				this.sidebarCollapsed ? '30px' : '150px'
			);
		});
	}

	tasks = $derived(this.#tasksQuery.current ?? []);
	projects = $derived(this.#projectsQuery.current ?? []);
	visions = $derived(this.#visionsQuery.current ?? []);

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

	/** Live count of tactical tasks linked to each project id (for card pills). */
	projectTaskCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const task of this.tasks) {
			if (task.projectId) counts[task.projectId] = (counts[task.projectId] ?? 0) + 1;
		}
		return counts;
	});

	projectById(id: string | null): Project | undefined {
		if (!id) return undefined;
		return this.projects.find((p) => p.id === id);
	}

	// ── Tactical tasks ────────────────────────────────────────────────────────

	async addTask(quadrant: Quadrant, title: string) {
		const trimmed = title.trim();
		if (!trimmed) return;

		const optimistic: Task = {
			id: newOptimisticId(),
			title: trimmed,
			quadrant,
			position: Date.now(),
			starred: false,
			done: false,
			notes: '',
			projectId: null,
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

	async assignTaskProject(id: string, projectId: string | null) {
		const task = this.tasks.find((t) => t.id === id);
		if (!task || task.projectId === projectId) return;

		try {
			await assignProject({ id, projectId }).updates(
				this.#tasksQuery.withOverride((current) =>
					current.map((t) => (t.id === id ? { ...t, projectId } : t))
				)
			);
		} catch {
			void this.#tasksQuery.refresh();
		}
	}

	// ── Projects (Level 2) ────────────────────────────────────────────────────

	async addProject(title: string) {
		const trimmed = title.trim();
		if (!trimmed) return;

		const optimistic: Project = {
			id: newOptimisticId(),
			title: trimmed,
			position: Date.now(),
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date()
		};

		try {
			await createProject({ title: trimmed }).updates(
				this.#projectsQuery.withOverride((current) => [...current, optimistic])
			);
		} catch {
			void this.#projectsQuery.refresh();
		}
	}

	async renameProject(id: string, title: string) {
		const trimmed = title.trim();
		if (!trimmed) return;

		try {
			await renameProject({ id, title: trimmed }).updates(
				this.#projectsQuery.withOverride((current) =>
					current.map((p) => (p.id === id ? { ...p, title: trimmed } : p))
				)
			);
		} catch {
			void this.#projectsQuery.refresh();
		}
	}

	async saveProjectNotes(id: string, notes: string) {
		try {
			await updateProjectNotes({ id, notes }).updates(
				this.#projectsQuery.withOverride((current) =>
					current.map((p) => (p.id === id ? { ...p, notes, updatedAt: new Date() } : p))
				)
			);
		} catch {
			void this.#projectsQuery.refresh();
		}
	}

	async removeProject(id: string) {
		try {
			await deleteProject({ id }).updates(
				this.#projectsQuery.withOverride((current) => current.filter((p) => p.id !== id))
			);
		} catch {
			void this.#projectsQuery.refresh();
		}
		// Tasks tagged with this project are now orphaned; refresh to clear chips.
		void this.#tasksQuery.refresh();
	}

	// ── Vision (Level 1) ──────────────────────────────────────────────────────

	async addVision(title: string) {
		const trimmed = title.trim();
		if (!trimmed) return;

		const optimistic: Vision = {
			id: newOptimisticId(),
			title: trimmed,
			position: Date.now(),
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date()
		};

		try {
			await createVision({ title: trimmed }).updates(
				this.#visionsQuery.withOverride((current) => [...current, optimistic])
			);
		} catch {
			void this.#visionsQuery.refresh();
		}
	}

	async renameVision(id: string, title: string) {
		const trimmed = title.trim();
		if (!trimmed) return;

		try {
			await renameVision({ id, title: trimmed }).updates(
				this.#visionsQuery.withOverride((current) =>
					current.map((v) => (v.id === id ? { ...v, title: trimmed } : v))
				)
			);
		} catch {
			void this.#visionsQuery.refresh();
		}
	}

	async saveVisionNotes(id: string, notes: string) {
		try {
			await updateVisionNotes({ id, notes }).updates(
				this.#visionsQuery.withOverride((current) =>
					current.map((v) => (v.id === id ? { ...v, notes, updatedAt: new Date() } : v))
				)
			);
		} catch {
			void this.#visionsQuery.refresh();
		}
	}

	async removeVision(id: string) {
		try {
			await deleteVision({ id }).updates(
				this.#visionsQuery.withOverride((current) => current.filter((v) => v.id !== id))
			);
		} catch {
			void this.#visionsQuery.refresh();
		}
	}
}

export function createMatrixState() {
	return new MatrixState();
}

export type MatrixStateType = ReturnType<typeof createMatrixState>;
