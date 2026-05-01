import { JoseKey } from '@atproto/jwk-jose';
import { randomBytes } from 'node:crypto';

const KEY_COUNT = 3;

async function main() {
	const cookieSecret = randomBytes(32).toString('base64url');
	console.log('# Copy these into your .env file');
	console.log(`COOKIE_SECRET=${cookieSecret}`);
	console.log(`PUBLIC_URL=http://127.0.0.1:5173`);

	for (let i = 1; i <= KEY_COUNT; i++) {
		const key = await JoseKey.generate(['ES256'], `key-${i}`);
		const jwk = JSON.stringify(key.privateJwk ?? key.jwk);
		console.log(`PRIVATE_JWK_${i}=${jwk}`);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
