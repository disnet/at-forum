import { json } from '@sveltejs/kit';
import { getPublicJwks } from '$lib/server/oauth/keys';

export const GET = async () => {
	const jwks = await getPublicJwks();
	return json(jwks, { headers: { 'cache-control': 'public, max-age=300' } });
};
