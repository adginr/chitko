import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { QUADRANTS, type Quadrant } from '$lib/matrix/quadrants';

export { QUADRANTS };
export type { Quadrant };

/** Timestamp columns shared by every table (ms precision, auto-managed). */
const timestamps = {
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date())
		.$onUpdate(() => new Date())
};

export const task = sqliteTable('task', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	quadrant: text('quadrant', { enum: QUADRANTS }).notNull(),
	position: integer('position').notNull(),
	starred: integer('starred', { mode: 'boolean' }).notNull().default(false),
	done: integer('done', { mode: 'boolean' }).notNull().default(false),
	notes: text('notes').notNull().default(''),
	// Optional link to a project (Level 2). Nullable, no cascade: deleting a
	// project only orphans the tag on its tasks.
	projectId: text('project_id'),
	...timestamps
});

/** Level 2 — concrete initiatives that tactical tasks can be tagged with. */
export const project = sqliteTable('project', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	position: integer('position').notNull(),
	notes: text('notes').notNull().default(''),
	...timestamps
});

/** Level 1 — long-term aspirations, a freeform ordered list. */
export const vision = sqliteTable('vision', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	position: integer('position').notNull(),
	notes: text('notes').notNull().default(''),
	...timestamps
});

export type Task = typeof task.$inferSelect;
export type NewTask = typeof task.$inferInsert;

export type Project = typeof project.$inferSelect;
export type NewProject = typeof project.$inferInsert;

export type Vision = typeof vision.$inferSelect;
export type NewVision = typeof vision.$inferInsert;
