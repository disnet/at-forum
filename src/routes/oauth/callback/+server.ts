import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getClient } from '$lib/server/oauth/client';
import { DID_COOKIE, signDid } from '$lib/server/cookies';
import { dev } from '$app/environment';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const client = await getClient();
	const { session } = await client.callback(url.searchParams);

	cookies.set(DID_COOKIE, signDid(session.did), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: 60 * 60 * 24 * 30
	});

	throw redirect(303, '/');
};
