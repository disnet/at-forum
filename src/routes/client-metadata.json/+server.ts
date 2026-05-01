import { json } from '@sveltejs/kit';
import { getClientMetadata } from '$lib/server/oauth/client';

export const GET = async () => {
	const metadata = await getClientMetadata();
	return json(metadata, { headers: { 'cache-control': 'public, max-age=300' } });
};
