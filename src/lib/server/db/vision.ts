import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { vision, type Vision } from './schema';

type Db = BetterSQLite3Database<typeof import('./schema')>;

export async function listVisions(db: Db): Promise<Vision[]> {
	return db.select().from(vision).orderBy(vision.position);
}

export async function createVision(db: Db, input: { title: string }): Promise<Vision> {
	const [created] = await db
		.insert(vision)
		.values({ title: input.title, position: Date.now() })
		.returning();
	return created;
}

export async function renameVision(db: Db, input: { id: string; title: string }): Promise<void> {
	await db.update(vision).set({ title: input.title }).where(eq(vision.id, input.id));
}

export async function updateVisionNotes(
	db: Db,
	input: { id: string; notes: string }
): Promise<void> {
	await db.update(vision).set({ notes: input.notes }).where(eq(vision.id, input.id));
}

export async function deleteVision(db: Db, input: { id: string }): Promise<void> {
	await db.delete(vision).where(eq(vision.id, input.id));
}
