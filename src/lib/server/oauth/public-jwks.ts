import type { Key } from '@atproto/jwk';

export function toPublicJwks(keyset: readonly Key[]) {
	return {
		keys: keyset.map((k) => {
			const pub = k.publicJwk;
			if (!pub) throw new Error(`Key ${k.kid ?? '(no kid)'} has no public JWK`);
			return Object.fromEntries(Object.entries(pub).filter(([, v]) => v !== undefined));
		})
	};
}
