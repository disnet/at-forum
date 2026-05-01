import { JoseKey } from '@atproto/jwk-jose';
import { env } from '$env/dynamic/private';

let cached: Promise<JoseKey[]> | null = null;

export function getKeyset(): Promise<JoseKey[]> {
	if (cached) return cached;
	cached = (async () => {
		const raw = [env.PRIVATE_JWK_1, env.PRIVATE_JWK_2, env.PRIVATE_JWK_3].filter(
			(v): v is string => typeof v === 'string' && v.length > 0
		);
		if (raw.length === 0) {
			throw new Error(
				'No private JWKs configured. Run `npm run generate-jwks` and copy output into .env.'
			);
		}
		return Promise.all(raw.map((jwk, i) => JoseKey.fromJWK(jwk, `key-${i + 1}`)));
	})();
	return cached;
}

export async function getPublicJwks() {
	const keyset = await getKeyset();
	return {
		keys: keyset.map((k) => {
			const jwk = { ...(k.jwk as Record<string, unknown>) };
			delete jwk.d;
			delete jwk.p;
			delete jwk.q;
			delete jwk.dp;
			delete jwk.dq;
			delete jwk.qi;
			return jwk;
		})
	};
}
