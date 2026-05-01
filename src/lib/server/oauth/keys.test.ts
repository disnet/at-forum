import { describe, it, expect } from 'vitest';
import { JoseKey } from '@atproto/jwk-jose';

// Mirror the public-jwks derivation from keys.ts without depending on $env imports.
async function publicJwksFor(keys: JoseKey[]) {
	return {
		keys: keys.map((k) => {
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

describe('public JWKS', () => {
	it('strips private material from every key', async () => {
		const keys = await Promise.all([
			JoseKey.generate(['ES256'], 'key-1'),
			JoseKey.generate(['ES256'], 'key-2')
		]);
		const jwks = await publicJwksFor(keys);
		expect(jwks.keys).toHaveLength(2);
		for (const k of jwks.keys) {
			expect(k).not.toHaveProperty('d');
			expect(k).not.toHaveProperty('p');
			expect(k).not.toHaveProperty('q');
			expect(k).toHaveProperty('kty');
			expect(k).toHaveProperty('kid');
		}
	});
});
