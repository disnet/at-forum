import { NodeOAuthClient, type NodeOAuthClientOptions } from '@atproto/oauth-client-node';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { sessionStore, stateStore } from './stores';
import { getKeyset } from './keys';

export const PUBLIC_URL = env.PUBLIC_URL ?? 'http://127.0.0.1:5173';

const SCOPE = 'atproto transition:generic';

let cached: Promise<NodeOAuthClient> | null = null;

export function getClient(): Promise<NodeOAuthClient> {
	if (cached) return cached;
	cached = build();
	return cached;
}

async function build(): Promise<NodeOAuthClient> {
	const keyset = await getKeyset();

	const redirectUri = `${PUBLIC_URL}/oauth/callback`;

	const clientMetadata = dev
		? buildDevMetadata(redirectUri)
		: buildProdMetadata(redirectUri, PUBLIC_URL);

	const options: NodeOAuthClientOptions = {
		clientMetadata,
		keyset,
		stateStore,
		sessionStore
	};

	return new NodeOAuthClient(options);
}

function buildDevMetadata(redirectUri: string): NodeOAuthClientOptions['clientMetadata'] {
	// Loopback / development client: client_id is the synthetic http://localhost URL.
	// The authorization server does not fetch client metadata in this mode.
	const clientId =
		`http://localhost?redirect_uri=${encodeURIComponent(redirectUri)}` +
		`&scope=${encodeURIComponent(SCOPE)}`;
	return {
		client_id: clientId,
		client_name: 'SvelteKit atproto demo (dev)',
		redirect_uris: [redirectUri as `http://127.0.0.1:${string}`],
		grant_types: ['authorization_code', 'refresh_token'],
		response_types: ['code'],
		scope: SCOPE,
		application_type: 'web',
		token_endpoint_auth_method: 'none',
		dpop_bound_access_tokens: true
	};
}

function buildProdMetadata(
	redirectUri: string,
	publicUrl: string
): NodeOAuthClientOptions['clientMetadata'] {
	return {
		client_id: `${publicUrl}/client-metadata.json` as `https://${string}`,
		client_name: 'SvelteKit atproto demo',
		client_uri: publicUrl as `https://${string}`,
		redirect_uris: [redirectUri as `https://${string}`],
		grant_types: ['authorization_code', 'refresh_token'],
		response_types: ['code'],
		scope: SCOPE,
		application_type: 'web',
		token_endpoint_auth_method: 'private_key_jwt',
		token_endpoint_auth_signing_alg: 'ES256',
		dpop_bound_access_tokens: true,
		jwks_uri: `${publicUrl}/jwks.json` as `https://${string}`
	};
}

export async function getClientMetadata() {
	const client = await getClient();
	return client.clientMetadata;
}
