import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Unlink only the Discord account (keep the osu! login) and go back to the Discord step.
export const GET = (async ({ locals }) => {
	await locals.session.update((d) => {
		delete d.discord;
		d.isReady = false;
		return d;
	});
	redirect(302, '/checks/discord');
}) satisfies RequestHandler;
