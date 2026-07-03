import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { project, type Project } from './schema';

type Db = BetterSQLite3Database<typeof import('./schema')>;

export async function listProjects(db: Db): Promise<Project[]> {
	return db.select().from(project).orderBy(project.position);
}

export async function createProject(db: Db, input: { title: string }): Promise<Project> {
	const [created] = await db
		.insert(project)
		.values({ title: input.title, position: Date.now() })
		.returning();
	return created;
}

export async function renameProject(db: Db, input: { id: string; title: string }): Promise<void> {
	await db.update(project).set({ title: input.title }).where(eq(project.id, input.id));
}

export async function updateProjectNotes(
	db: Db,
	input: { id: string; notes: string }
): Promise<void> {
	await db.update(project).set({ notes: input.notes }).where(eq(project.id, input.id));
}

export async function deleteProject(db: Db, input: { id: string }): Promise<void> {
	await db.delete(project).where(eq(project.id, input.id));
}
