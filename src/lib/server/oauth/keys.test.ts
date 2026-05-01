import { describe, it, expect } from 'vitest';
import { JoseKey } from '@atproto/jwk-jose';
import { toPublicJwks } from './public-jwks';

describe('toPublicJwks', () => {
	it('strips private material from every key', async () => {
		const keys = await Promise.all([
			JoseKey.generate(['ES256'], 'key-1'),
			JoseKey.generate(['ES256'], 'key-2')
		]);
		const jwks = toPublicJwks(keys);
		expect(jwks.keys).toHaveLength(2);
		for (const k of jwks.keys) {
			expect(k).not.toHaveProperty('d');
			expect(k).not.toHaveProperty('p');
			expect(k).not.toHaveProperty('q');
			expect(k).not.toHaveProperty('dp');
			expect(k).not.toHaveProperty('dq');
			expect(k).not.toHaveProperty('qi');
			expect(k).toHaveProperty('kty');
			expect(k).toHaveProperty('kid');
		}
		expect(jwks.keys.map((k) => k.kid)).toEqual(['key-1', 'key-2']);
	});
});
