import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getClient } from '$lib/server/oauth/client';
import { DID_COOKIE } from '$lib/server/cookies';

export const POST: RequestHandler = async ({ cookies, locals }) => {
	if (locals.did) {
		try {
			const client = await getClient();
			await client.revoke(locals.did);
		} catch {
			// ignore revoke errors — clear the cookie regardless.
		}
	}
	cookies.delete(DID_COOKIE, { path: '/' });
	throw redirect(303, '/');
};
