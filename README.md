# SvelteKit + atproto OAuth

A minimal SvelteKit app demonstrating sign-in with [atproto OAuth](https://atproto.com/specs/oauth)
using [`@atproto/oauth-client-node`](https://www.npmjs.com/package/@atproto/oauth-client-node).

This skeleton is the Phase 0 starting point for an atproto-native
alt-frontend for `discourse.atprotocol.community`. See [DESIGN.md](./DESIGN.md)
for the project sketch.

## Stack

- SvelteKit (skeleton, TypeScript) with `@sveltejs/adapter-node`.
- `@atproto/oauth-client-node` for the OAuth flow (PAR, DPoP, refresh).
- `@atproto/api` `Agent` for authenticated requests against the user's PDS.
- In-memory session/state stores. **Sessions are lost on restart and don't sync
  across processes** — replace `MemoryStore` in `src/lib/server/oauth/stores.ts`
  with a Redis/SQLite-backed store before deploying.

## Quickstart

```bash
npm install
npm run generate-jwks > .env
npm run dev
```

`generate-jwks` writes `COOKIE_SECRET`, `PUBLIC_URL`, and three ES256
`PRIVATE_JWK_*` values to stdout. Open `http://127.0.0.1:5173` and click
"Sign in with Bluesky".

> Use `127.0.0.1`, not `localhost`. atproto's loopback client mode is keyed on
> the literal `127.0.0.1` redirect URI.

## Endpoints

| Path | Purpose |
| --- | --- |
| `GET /` | Home page — shows handle if signed in, login link otherwise. |
| `GET /login` | Sign-in form. |
| `POST /login` | Starts the OAuth flow → redirects to authorization server. |
| `GET /oauth/callback` | OAuth redirect target. Sets a signed `did` cookie. |
| `POST /logout` | Revokes the session and clears the cookie. |
| `GET /jwks.json` | Public JWKS (production client metadata). |
| `GET /client-metadata.json` | OAuth client metadata (production). |

## Dev vs prod client metadata

In dev (`NODE_ENV !== 'production'`), the client uses the loopback `client_id`
form (`http://localhost?redirect_uri=...&scope=...`); the authorization server
does not fetch any metadata document, so `127.0.0.1` Just Works.

In prod, set `PUBLIC_URL` to your `https://` origin. `client_id` becomes
`${PUBLIC_URL}/client-metadata.json`, and the authorization server fetches that
URL plus `${PUBLIC_URL}/jwks.json` to verify signatures. Both endpoints are
served by this app.

## Out of scope

- Persistent sessions (DB/Redis).
- App Password / legacy auth.
- UI styling beyond minimal HTML.
- Anything beyond `getProfile` to demonstrate the authenticated agent.
