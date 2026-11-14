import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import {
	registrationDeadline,
	registrationSecondsLeft,
	registrationClosedMessage
} from './registration';
import { handleRegistration } from './server/registration';

afterEach(() => vi.useRealTimers());

describe('registration deadline', () => {
	it('accepts the entire final second and closes at midnight UTC+9', () => {
		expect(registrationSecondsLeft(Date.parse('2026-11-29T23:59:59+09:00'))).toBe(1);
		expect(registrationSecondsLeft(registrationDeadline - 1)).toBe(1);
		expect(registrationSecondsLeft(registrationDeadline)).toBe(0);
		expect(registrationSecondsLeft(registrationDeadline + 1000)).toBe(0);
	});

	const request = (path: string, now: number) => {
		vi.useFakeTimers();
		vi.setSystemTime(now);
		const resolve = vi.fn(async () => new Response('allowed'));
		const response = handleRegistration({
			event: { url: new URL(path, 'https://example.com') } as RequestEvent,
			resolve
		});
		return { response, resolve };
	};

	it('allows registration just before midnight', async () => {
		const { response, resolve } = request('/api/discord/setup', registrationDeadline - 1);
		expect((await response).status).toBe(200);
		expect(resolve).toHaveBeenCalledOnce();
	});

	it('rejects direct setup requests at midnight before any side effects', async () => {
		const { response, resolve } = request('/api/discord/setup', registrationDeadline);
		const result = await response;
		expect(result.status).toBe(403);
		expect(await result.json()).toEqual({ result: 'error', message: registrationClosedMessage });
		expect(resolve).not.toHaveBeenCalled();
	});

	it.each(['/auth/osu', '/auth/discord/callback', '/checks/region', '/loading'])(
		'redirects closed registration flow %s',
		async (path) => {
			const { response, resolve } = request(path, registrationDeadline);
			await expect(response).rejects.toMatchObject({ status: 303, location: '/' });
			expect(resolve).not.toHaveBeenCalled();
		}
	);

	it.each(['/', '/done', '/logout'])('keeps %s available after closing', async (path) => {
		const { response, resolve } = request(path, registrationDeadline + 1);
		expect((await response).status).toBe(200);
		expect(resolve).toHaveBeenCalledOnce();
	});
});
