import { error } from '@sveltejs/kit';
import { query, command } from '$app/server';
import { db } from '$lib/server/db';
import * as tasks from '$lib/server/db/tasks';
import { QUADRANTS, type Quadrant } from '$lib/server/db/schema';

function assertQuadrant(value: unknown): asserts value is Quadrant {
	if (typeof value !== 'string' || !(QUADRANTS as readonly string[]).includes(value)) {
		error(400, 'Invalid quadrant');
	}
}

export const listTasks = query(async () => tasks.listTasks(db));

export const createTask = command(
	'unchecked',
	async (input: { quadrant: Quadrant; title: string }) => {
		assertQuadrant(input.quadrant);
		const title = input.title.trim();
		if (!title) error(400, 'Title required');

		const created = await tasks.createTask(db, { quadrant: input.quadrant, title });
		void listTasks().refresh();
		return created;
	}
);

export const moveTask = command('unchecked', async (input: { id: string; quadrant: Quadrant }) => {
	assertQuadrant(input.quadrant);
	await tasks.moveTask(db, input);
	void listTasks().refresh();
});

export const renameTask = command('unchecked', async (input: { id: string; title: string }) => {
	const title = input.title.trim();
	if (!title) error(400, 'Title required');

	await tasks.renameTask(db, { id: input.id, title });
	void listTasks().refresh();
});

export const toggleStar = command('unchecked', async (input: { id: string }) => {
	await tasks.toggleStar(db, input);
	void listTasks().refresh();
});

export const toggleDone = command('unchecked', async (input: { id: string }) => {
	await tasks.toggleDone(db, input);
	void listTasks().refresh();
});

export const deleteTask = command('unchecked', async (input: { id: string }) => {
	await tasks.deleteTask(db, input);
	void listTasks().refresh();
});

export const updateNotes = command('unchecked', async (input: { id: string; notes: string }) => {
	await tasks.updateNotes(db, input);
	void listTasks().refresh();
});
