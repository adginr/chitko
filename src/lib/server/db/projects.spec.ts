import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import {
	listProjects,
	createProject,
	renameProject,
	updateProjectNotes,
	deleteProject
} from './projects';

function createTestDb() {
	const client = new Database(':memory:');
	client.exec(`
		CREATE TABLE project (
			id text PRIMARY KEY NOT NULL,
			title text NOT NULL,
			position integer NOT NULL,
			notes text DEFAULT '' NOT NULL,
			created_at integer NOT NULL,
			updated_at integer NOT NULL
		);
	`);
	return drizzle(client, { schema });
}

describe('projects db layer', () => {
	let db: ReturnType<typeof createTestDb>;

	beforeEach(() => {
		db = createTestDb();
	});

	it('creates a project with defaults', async () => {
		const created = await createProject(db, { title: 'Launch' });

		expect(created.title).toBe('Launch');
		expect(created.notes).toBe('');
		expect(created.position).toBeGreaterThan(0);
	});

	it('lists projects ordered by position', async () => {
		const a = await createProject(db, { title: 'A' });
		const b = await createProject(db, { title: 'B' });

		const list = await listProjects(db);
		expect(list.map((p) => p.id)).toEqual([a.id, b.id]);
	});

	it('renames a project', async () => {
		const created = await createProject(db, { title: 'Old' });

		await renameProject(db, { id: created.id, title: 'New' });

		const [renamed] = await listProjects(db);
		expect(renamed.title).toBe('New');
	});

	it('updates notes', async () => {
		const created = await createProject(db, { title: 'Notes me' });

		await updateProjectNotes(db, { id: created.id, notes: '# Plan' });

		const [updated] = await listProjects(db);
		expect(updated.notes).toBe('# Plan');
	});

	it('deletes a project', async () => {
		const created = await createProject(db, { title: 'Delete me' });

		await deleteProject(db, { id: created.id });

		expect(await listProjects(db)).toEqual([]);
	});
});
