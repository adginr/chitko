import { eq, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { task, type Quadrant, type Task } from './schema';

type Db = BetterSQLite3Database<typeof import('./schema')>;

export async function listTasks(db: Db): Promise<Task[]> {
	return db.select().from(task);
}

export async function createTask(
	db: Db,
	input: { quadrant: Quadrant; title: string }
): Promise<Task> {
	const [created] = await db
		.insert(task)
		.values({ quadrant: input.quadrant, title: input.title, position: Date.now() })
		.returning();
	return created;
}

export async function moveTask(db: Db, input: { id: string; quadrant: Quadrant }): Promise<void> {
	await db
		.update(task)
		.set({ quadrant: input.quadrant, position: Date.now() })
		.where(eq(task.id, input.id));
}

export async function renameTask(db: Db, input: { id: string; title: string }): Promise<void> {
	await db.update(task).set({ title: input.title }).where(eq(task.id, input.id));
}

export async function toggleStar(db: Db, input: { id: string }): Promise<void> {
	await db
		.update(task)
		.set({ starred: sql`NOT ${task.starred}` })
		.where(eq(task.id, input.id));
}

export async function toggleDone(db: Db, input: { id: string }): Promise<void> {
	await db
		.update(task)
		.set({ done: sql`NOT ${task.done}` })
		.where(eq(task.id, input.id));
}

export async function deleteTask(db: Db, input: { id: string }): Promise<void> {
	await db.delete(task).where(eq(task.id, input.id));
}

export async function updateNotes(db: Db, input: { id: string; notes: string }): Promise<void> {
	await db.update(task).set({ notes: input.notes }).where(eq(task.id, input.id));
}
