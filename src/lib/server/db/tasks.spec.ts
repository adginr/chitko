import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import {
	listTasks,
	createTask,
	moveTask,
	renameTask,
	toggleStar,
	toggleDone,
	deleteTask,
	updateNotes
} from './tasks';

function createTestDb() {
	const client = new Database(':memory:');
	client.exec(`
		CREATE TABLE task (
			id text PRIMARY KEY NOT NULL,
			title text NOT NULL,
			quadrant text NOT NULL,
			position integer NOT NULL,
			starred integer DEFAULT 0 NOT NULL,
			done integer DEFAULT 0 NOT NULL,
			notes text DEFAULT '' NOT NULL,
			project_id text,
			created_at integer NOT NULL,
			updated_at integer NOT NULL
		);
	`);
	return drizzle(client, { schema });
}

describe('tasks db layer', () => {
	let db: ReturnType<typeof createTestDb>;

	beforeEach(() => {
		db = createTestDb();
	});

	it('creates a task with defaults', async () => {
		const created = await createTask(db, { quadrant: 'q1', title: 'Write report' });

		expect(created.title).toBe('Write report');
		expect(created.quadrant).toBe('q1');
		expect(created.starred).toBe(false);
		expect(created.notes).toBe('');
		expect(created.position).toBeGreaterThan(0);
	});

	it('lists created tasks', async () => {
		await createTask(db, { quadrant: 'q1', title: 'A' });
		await createTask(db, { quadrant: 'q2', title: 'B' });

		const tasks = await listTasks(db);

		expect(tasks.map((t) => t.title).sort()).toEqual(['A', 'B']);
	});

	it('moves a task to a different quadrant and bumps position', async () => {
		const created = await createTask(db, { quadrant: 'q1', title: 'Move me' });

		await moveTask(db, { id: created.id, quadrant: 'q3' });

		const [moved] = await listTasks(db);
		expect(moved.quadrant).toBe('q3');
		expect(moved.position).toBeGreaterThanOrEqual(created.position);
	});

	it('renames a task', async () => {
		const created = await createTask(db, { quadrant: 'q1', title: 'Old title' });

		await renameTask(db, { id: created.id, title: 'New title' });

		const [renamed] = await listTasks(db);
		expect(renamed.title).toBe('New title');
	});

	it('toggles star on and back off', async () => {
		const created = await createTask(db, { quadrant: 'q1', title: 'Star me' });

		await toggleStar(db, { id: created.id });
		const [starred] = await listTasks(db);
		expect(starred.starred).toBe(true);

		await toggleStar(db, { id: created.id });
		const [unstarred] = await listTasks(db);
		expect(unstarred.starred).toBe(false);
	});

	it('toggles done on and back off', async () => {
		const created = await createTask(db, { quadrant: 'q1', title: 'Finish me' });

		await toggleDone(db, { id: created.id });
		const [done] = await listTasks(db);
		expect(done.done).toBe(true);

		await toggleDone(db, { id: created.id });
		const [notDone] = await listTasks(db);
		expect(notDone.done).toBe(false);
	});

	it('deletes a task', async () => {
		const created = await createTask(db, { quadrant: 'q1', title: 'Delete me' });

		await deleteTask(db, { id: created.id });

		expect(await listTasks(db)).toEqual([]);
	});

	it('updates notes', async () => {
		const created = await createTask(db, { quadrant: 'q1', title: 'Notes me' });

		await updateNotes(db, { id: created.id, notes: '# Heading\n\n**bold**' });

		const [updated] = await listTasks(db);
		expect(updated.notes).toBe('# Heading\n\n**bold**');
	});
});
