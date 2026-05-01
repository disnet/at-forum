import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { getClient } from '$lib/server/oauth/client';

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const handle = String(data.get('handle') ?? '').trim();
		if (!handle) return fail(400, { error: 'Please enter a handle.' });

		let url: URL;
		try {
			const client = await getClient();
			url = await client.authorize(handle, { scope: 'atproto transition:generic' });
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Authorization failed.';
			return fail(400, { error: message });
		}
		throw redirect(303, url.toString());
	}
};
