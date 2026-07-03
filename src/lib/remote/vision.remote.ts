import { error } from '@sveltejs/kit';
import { query, command } from '$app/server';
import { db } from '$lib/server/db';
import * as vision from '$lib/server/db/vision';

export const listVisions = query(async () => vision.listVisions(db));

export const createVision = command('unchecked', async (input: { title: string }) => {
	const title = input.title.trim();
	if (!title) error(400, 'Title required');

	const created = await vision.createVision(db, { title });
	void listVisions().refresh();
	return created;
});

export const renameVision = command('unchecked', async (input: { id: string; title: string }) => {
	const title = input.title.trim();
	if (!title) error(400, 'Title required');

	await vision.renameVision(db, { id: input.id, title });
	void listVisions().refresh();
});

export const updateVisionNotes = command(
	'unchecked',
	async (input: { id: string; notes: string }) => {
		await vision.updateVisionNotes(db, input);
		void listVisions().refresh();
	}
);

export const deleteVision = command('unchecked', async (input: { id: string }) => {
	await vision.deleteVision(db, input);
	void listVisions().refresh();
});
