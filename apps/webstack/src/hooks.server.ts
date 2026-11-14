import { handleSession } from 'svelte-kit-cookie-session';
import { env } from '$env/dynamic/private';
import { sequence } from '@sveltejs/kit/hooks';
import { handleRegistration } from '$lib/server/registration';

export const first = handleSession({
	secret: `${env.PRIVATE_COOKIE_SECRET}`
});

export const handle = sequence(handleRegistration, first);
