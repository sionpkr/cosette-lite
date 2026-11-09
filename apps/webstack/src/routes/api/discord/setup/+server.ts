import type { RequestHandler } from './$types';
import { config } from 'config';
import { logger } from '$lib/logger';
import { BotResult } from '$lib/DiscordTypes';
import { checkLink, saveLink, sheetEnabled } from '$lib/sheet';
import { getGuildMember, joinDiscordServer, modifyGuildMember, MemberResult } from '$lib/discord';

export const POST = (async ({ locals }) => {
	const discordId = locals.session.data.discord?.id;
	const accessToken = locals.session.data.discord?.accessToken;
	const osuUsername = locals.session.data.osu?.username ?? '';

	const regionRoleId = locals.session.data.discord?.regionRoleId;

	if (!discordId || !accessToken) {
		return new Response(JSON.stringify({ result: 'error', message: 'Missing session data.' }), {
			status: 400
		});
	}

	const verifiedRole = config.discord.roles.find((r) => r.name === 'Verified');
	if (
		!verifiedRole ||
		!config.discord.roles.some((r) => r.id === regionRoleId && r !== verifiedRole)
	) {
		return new Response(
			JSON.stringify({
				result: 'error',
				message: '지역이 선택되지 않았습니다. 처음부터 다시 시도해주세요.'
			}),
			{ status: 400 }
		);
	}
	const requiredRoles = [verifiedRole.id, regionRoleId!];

	const osuId = locals.session.data.osu?.id ?? '';
	const discordName = locals.session.data.discord?.username ?? '';

	// Link registry (Google Sheet). If the sheet is down, fail open: still grant roles.
	let rowNumber: number | null = null;
	const useSheet = sheetEnabled() && !!osuId;
	if (useSheet) {
		try {
			const check = await checkLink(discordId, osuId);
			if (!check.ok) {
				const message =
					check.reason === 'osu-taken'
						? '이 osu! 계정은 이미 다른 Discord 계정에 연동되어 있습니다.'
						: '이 Discord 계정은 이미 다른 osu! 계정에 연동되어 있습니다.';
				logger.warn(`Blocked link ${discordId}/${osuId}: ${check.reason}`);
				return new Response(JSON.stringify({ result: 'error', message }));
			}
			rowNumber = check.rowNumber;
		} catch (e) {
			logger.error(e);
		}
	}

	const markDone = async () => {
		if (useSheet) {
			try {
				await saveLink(
					{ discordId, osuId, osuUsername, discordName, regionRoleId: regionRoleId! },
					rowNumber
				);
			} catch (e) {
				logger.error(e);
			}
		}
		await locals.session.update((d) => {
			d.isReady = true;
			return d;
		});
	};

	const memberCheck = await getGuildMember(discordId);

	if (memberCheck.result === MemberResult.Found) {
		logger.info(`User ${discordId} already exists in the guild. Adding roles...`);

		const guildMember = memberCheck.content as { roles: string[] };
		const configIds = new Set(config.discord.roles.map((val) => val.id));
		// Drop previously assigned region roles so a re-pick replaces them.
		const mergedRoles = Array.from(
			new Set([...(guildMember.roles || []).filter((id) => !configIds.has(id)), ...requiredRoles])
		);
		const addRoleRes = await modifyGuildMember(discordId, osuUsername, mergedRoles);

		if (addRoleRes.result === BotResult.Success) {
			await markDone();
			return new Response(JSON.stringify({ result: 'success' }));
		}

		return new Response(
			JSON.stringify({
				result: 'error',
				message: addRoleRes.error?.message || 'Failed adding roles'
			}),
			{ status: 500 }
		);
	}

	if (memberCheck.result === MemberResult.NotFound) {
		const joinRes = await joinDiscordServer(discordId, accessToken, osuUsername, requiredRoles);

		if (joinRes.result === BotResult.Full) {
			await locals.session.update((d) => {
				d.error = 'You have joined the maximum amount of servers.';
				return d;
			});
			return new Response(JSON.stringify({ result: 'full' }), { status: 200 });
		}

		if (joinRes.result !== BotResult.Success) {
			return new Response(
				JSON.stringify({
					result: 'error',
					message: joinRes.error?.message || 'Failed to join server'
				}),
				{ status: 500 }
			);
		}

		const addRoleRes = await modifyGuildMember(discordId, osuUsername, requiredRoles);

		if (addRoleRes.result === BotResult.Success) {
			await markDone();
			return new Response(JSON.stringify({ result: 'success' }));
		}

		return new Response(
			JSON.stringify({
				result: 'error',
				message: addRoleRes.error?.message || 'Failed adding roles'
			}),
			{ status: 500 }
		);
	}

	return new Response(JSON.stringify({ result: 'error', message: 'Discord API error' }), {
		status: 502
	});
}) satisfies RequestHandler;
