import { config } from 'config';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
	if (!locals.session.data.osu) redirect(302, '/auth/osu');
	if (!locals.session.data.discord?.id) redirect(302, '/checks/discord');

	return {
		username: locals.session.data.osu.username,
		osuId: locals.session.data.osu.id
	};
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request, locals }) => {
		if (!locals.session.data.discord?.id) redirect(302, '/checks/discord');

		const region = (await request.formData()).get('region');
		// Must be a configured role other than Verified.
		if (!config.discord.roles.some((r) => r.id === region && r.name !== 'Verified')) {
			return fail(400, { error: '지역을 선택해주세요.' });
		}

		await locals.session.update((d) => {
			d.discord!.regionRoleId = region as string;
			return d;
		});
		redirect(303, '/loading');
	}
} satisfies Actions;
