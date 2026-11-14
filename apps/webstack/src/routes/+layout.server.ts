import type { LayoutServerLoad } from './$types';
import { config } from 'config';

export const load = (async ({ locals }) => {
	return {
		serverNow: Date.now(),
		config,
		session: locals.session.data // You can also use your old `getSession` function if you wish.
	};
}) satisfies LayoutServerLoad;
