import { json, redirect, type Handle } from '@sveltejs/kit';
import { registrationClosedMessage, registrationSecondsLeft } from '$lib/registration';

export const handleRegistration: Handle = async ({ event, resolve }) => {
	if (registrationSecondsLeft(Date.now()) === 0) {
		const path = event.url.pathname;
		if (path === '/api/discord/setup') {
			return json({ result: 'error', message: registrationClosedMessage }, { status: 403 });
		}
		if (path.startsWith('/auth/') || path.startsWith('/checks/') || path === '/loading') {
			redirect(303, '/');
		}
	}
	return resolve(event);
};
