import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { QUADRANTS, type Quadrant } from '$lib/matrix/quadrants';

export { QUADRANTS };
export type { Quadrant };

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
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date())
		.$onUpdate(() => new Date())
});

export type Task = typeof task.$inferSelect;
export type NewTask = typeof task.$inferInsert;
