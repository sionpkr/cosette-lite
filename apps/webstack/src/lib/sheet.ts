import { createSign } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/logger';

// Columns: discordId, osuId, osuUsername, discordName, regionRoleId, linkedAt
export type LinkRow = {
	discordId: string;
	osuId: string;
	osuUsername: string;
	discordName: string;
	regionRoleId: string;
};

export type LinkCheck =
	| { ok: true; rowNumber: number | null }
	| { ok: false; reason: 'osu-taken' | 'discord-has-other-osu' };

const API = 'https://sheets.googleapis.com/v4/spreadsheets';

export const sheetEnabled = () =>
	!!(env.GOOGLE_SA_EMAIL && env.GOOGLE_SA_KEY && env.SHEET_ID);

// ponytail: module-level cache per serverless instance; fine for the ~1h token lifetime.
let cachedToken: { value: string; exp: number } | null = null;
let cachedTab: string | null = null;

const b64url = (v: string | Buffer) => Buffer.from(v).toString('base64url');

async function getToken(): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.value;

	const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
	const claim = b64url(
		JSON.stringify({
			iss: env.GOOGLE_SA_EMAIL,
			scope: 'https://www.googleapis.com/auth/spreadsheets',
			aud: 'https://oauth2.googleapis.com/token',
			iat: now,
			exp: now + 3600
		})
	);
	const sig = createSign('RSA-SHA256')
		.update(`${header}.${claim}`)
		.sign(env.GOOGLE_SA_KEY!.replace(/\\n/g, '\n'));
	const jwt = `${header}.${claim}.${b64url(sig)}`;

	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
			assertion: jwt
		})
	});
	if (!res.ok) throw new Error(`Google token error ${res.status}: ${await res.text()}`);
	const { access_token, expires_in } = await res.json();
	cachedToken = { value: access_token, exp: now + expires_in };
	return access_token;
}

async function sheets(path: string, init: RequestInit = {}) {
	const res = await fetch(`${API}/${env.SHEET_ID}${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${await getToken()}`,
			'Content-Type': 'application/json'
		}
	});
	if (!res.ok) throw new Error(`Sheets API ${res.status}: ${await res.text()}`);
	return res.json();
}

// First tab, whatever it is named (e.g. "Sheet1" / "시트1").
async function tab(): Promise<string> {
	if (cachedTab) return cachedTab;
	const meta = await sheets('?fields=sheets.properties.title');
	cachedTab = meta.sheets[0].properties.title as string;
	return cachedTab;
}

const range = async (r: string) => encodeURIComponent(`'${await tab()}'!${r}`);

/** Read-only policy check. Throws on Sheets failure (caller decides to fail open). */
export async function checkLink(discordId: string, osuId: string): Promise<LinkCheck> {
	const data = await sheets(`/values/${await range('A2:B')}`);
	const rows: string[][] = data.values ?? [];

	let rowNumber: number | null = null;
	for (let i = 0; i < rows.length; i++) {
		const [d, o] = rows[i];
		if (d === discordId && o === osuId) rowNumber = i + 2;
		else if (o === osuId) return { ok: false, reason: 'osu-taken' };
		else if (d === discordId) return { ok: false, reason: 'discord-has-other-osu' };
	}
	return { ok: true, rowNumber };
}

/** Update the existing row, or append a new one. */
export async function saveLink(row: LinkRow, rowNumber: number | null) {
	const values = [
		[
			row.discordId,
			row.osuId,
			row.osuUsername,
			row.discordName,
			row.regionRoleId,
			new Date().toISOString()
		]
	];
	const body = JSON.stringify({ values });
	if (rowNumber) {
		await sheets(`/values/${await range(`A${rowNumber}:F${rowNumber}`)}?valueInputOption=RAW`, {
			method: 'PUT',
			body
		});
	} else {
		await sheets(`/values/${await range('A:F')}:append?valueInputOption=RAW`, {
			method: 'POST',
			body
		});
	}
	logger.info(`Saved link ${row.discordId} <-> ${row.osuId} to sheet`);
}
