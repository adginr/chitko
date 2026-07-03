import { error } from '@sveltejs/kit';
import { query, command } from '$app/server';
import { db } from '$lib/server/db';
import * as projects from '$lib/server/db/projects';

export const listProjects = query(async () => projects.listProjects(db));

export const createProject = command('unchecked', async (input: { title: string }) => {
	const title = input.title.trim();
	if (!title) error(400, 'Title required');

	const created = await projects.createProject(db, { title });
	void listProjects().refresh();
	return created;
});

export const renameProject = command('unchecked', async (input: { id: string; title: string }) => {
	const title = input.title.trim();
	if (!title) error(400, 'Title required');

	await projects.renameProject(db, { id: input.id, title });
	void listProjects().refresh();
});

export const updateProjectNotes = command(
	'unchecked',
	async (input: { id: string; notes: string }) => {
		await projects.updateProjectNotes(db, input);
		void listProjects().refresh();
	}
);

export const deleteProject = command('unchecked', async (input: { id: string }) => {
	await projects.deleteProject(db, input);
	void listProjects().refresh();
});
