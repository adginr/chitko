import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { listVisions, createVision, renameVision, updateVisionNotes, deleteVision } from './vision';

function createTestDb() {
	const client = new Database(':memory:');
	client.exec(`
		CREATE TABLE vision (
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

describe('vision db layer', () => {
	let db: ReturnType<typeof createTestDb>;

	beforeEach(() => {
		db = createTestDb();
	});

	it('creates a vision with defaults', async () => {
		const created = await createVision(db, { title: 'Grow' });

		expect(created.title).toBe('Grow');
		expect(created.notes).toBe('');
		expect(created.position).toBeGreaterThan(0);
	});

	it('lists visions ordered by position', async () => {
		const a = await createVision(db, { title: 'A' });
		const b = await createVision(db, { title: 'B' });

		const list = await listVisions(db);
		expect(list.map((v) => v.id)).toEqual([a.id, b.id]);
	});

	it('renames a vision', async () => {
		const created = await createVision(db, { title: 'Old' });

		await renameVision(db, { id: created.id, title: 'New' });

		const [renamed] = await listVisions(db);
		expect(renamed.title).toBe('New');
	});

	it('updates notes', async () => {
		const created = await createVision(db, { title: 'Notes me' });

		await updateVisionNotes(db, { id: created.id, notes: '# Dream' });

		const [updated] = await listVisions(db);
		expect(updated.notes).toBe('# Dream');
	});

	it('deletes a vision', async () => {
		const created = await createVision(db, { title: 'Delete me' });

		await deleteVision(db, { id: created.id });

		expect(await listVisions(db)).toEqual([]);
	});
});
