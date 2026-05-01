import type { Handle } from '@sveltejs/kit';
import { Agent } from '@atproto/api';
import { getClient } from '$lib/server/oauth/client';
import { DID_COOKIE, verifyDid } from '$lib/server/cookies';

export const handle: Handle = async ({ event, resolve }) => {
	const did = verifyDid(event.cookies.get(DID_COOKIE));
	if (did) {
		try {
			const client = await getClient();
			const session = await client.restore(did);
			event.locals.did = session.did;
			event.locals.agent = new Agent(session);
		} catch {
			event.cookies.delete(DID_COOKIE, { path: '/' });
		}
	}
	return resolve(event);
};
