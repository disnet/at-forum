import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

export const DID_COOKIE = 'atproto_did';

function getSecret(): string {
	const s = env.COOKIE_SECRET;
	if (!s || s.length < 32) {
		throw new Error('COOKIE_SECRET must be set to a value of at least 32 chars in .env');
	}
	return s;
}

function sign(value: string): string {
	const mac = createHmac('sha256', getSecret()).update(value).digest('base64url');
	return `${value}.${mac}`;
}

export function signDid(did: string): string {
	return sign(did);
}

export function verifyDid(signed: string | undefined): string | null {
	if (!signed) return null;
	const idx = signed.lastIndexOf('.');
	if (idx < 0) return null;
	const value = signed.slice(0, idx);
	const mac = signed.slice(idx + 1);
	const expected = createHmac('sha256', getSecret()).update(value).digest('base64url');
	const a = Buffer.from(mac);
	const b = Buffer.from(expected);
	if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
	return value;
}
