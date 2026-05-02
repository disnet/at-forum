# Design sketch — atproto-native alt-frontend for `discourse.atprotocol.community`

> Status: **sketch**. Decisions here are starting points, not commitments.
> The goal of this doc is to make the shape of the project legible enough
> that we can disagree about specific pieces and start building the
> uncontroversial ones.

## 1. What we are building

A read-first alternative web client for the Discourse forum at
`https://discourse.atprotocol.community`, with atproto as the default
identity layer.

The mental model is: **what NPMX did for npm, but for this Discourse
instance.** We do not replace Discourse — Discourse is still the system
of record for posts, categories, users, and moderation. We render its
data through a UI that:

- loads fast and reads cleanly on mobile,
- treats atproto identity as a first-class citizen (avatars, handles,
  cross-links to Bluesky profiles, etc.),
- can deep-link into the canonical Discourse URLs whenever the user
  wants the "real" forum.

Non-goals for v1:

- A general-purpose alt-client for arbitrary Discourse instances.
  We target this one site. Generalization is a later question.
- Replacing Discourse's moderation, notifications, trust levels, or
  admin tools.
- A native mobile app. Web only, but mobile-first.

## 2. Why this is interesting

The atproto community lives in two places: Bluesky (atproto-native,
identity = DID) and this Discourse forum (legacy username/password,
identity = Discourse account). Cross-referencing is manual and
lossy — you cannot tell at a glance that forum user `alice` is
`@alice.bsky.social`.

An atproto-native frontend lets us:

1. Show a forum poster's **atproto handle, avatar, and display name**
   when they have linked one, with a one-click jump to their PDS
   profile.
2. Sign in once with atproto and (eventually) post to the forum
   without managing a second password.
3. Experiment with surfaces that Discourse's stock UI does not
   prioritize — e.g. an activity feed scoped to people you follow on
   Bluesky.

## 3. Scope by phase

We ship in thin slices. Each phase should be independently shippable
and useful to at least one real user (probably us).

### Phase 0 — done

- SvelteKit skeleton with `@sveltejs/adapter-node`.
- atproto OAuth sign-in (`@atproto/oauth-client-node`), DPoP, JWKS,
  signed `did` cookie.
- In-memory session/state stores (replace before deploy — see §7).

### Phase 1 — read-only browser

Anonymous reading of the forum, no Discourse account required.

- Routes: home (latest), `/c/<category>`, `/t/<topic-id>`,
  `/u/<username>`, `/search?q=…`.
- Server-side fetch of Discourse's public JSON endpoints
  (`/latest.json`, `/c/<slug>/<id>.json`, `/t/<id>.json`,
  `/u/<username>.json`, `/search.json`).
- Markdown / "cooked" HTML rendered with a sanitizer
  (Discourse already returns sanitized HTML in `cooked`; we still
  want our own pass for safety).
- A simple in-process response cache keyed by URL + ETag, with a
  short TTL (~30s for indexes, ~5m for topic bodies).

### Phase 2 — atproto identity overlay

For any Discourse user who has linked an atproto handle, show that
identity wherever we'd otherwise show their Discourse handle.

- **Linking mechanism (proposed):** a Discourse custom user field
  named `atproto_handle`. Users self-declare the link in their forum
  profile; we trust the forum's value as far as the forum trusts it
  and additionally verify that the handle resolves to a DID via the
  standard atproto handle resolution flow.
- For a stronger guarantee we can require a reciprocal proof: the
  user posts the link to their forum profile in a public Bluesky
  post or an `app.bsky.actor.profile` description that mentions the
  forum username. v1 can ship without this and add it later.
- When signed in via atproto, the user's *own* atproto handle is
  shown in the header. We do not yet require a Discourse account.

### Phase 3 — posting & writes

This is the part with real product/architecture choices. We do not
need to decide today, but the sketch needs to acknowledge the fork.

Three plausible approaches, in rough order of how much we'd own:

1. **Discourse Connect (SSO) bridge.** Stand up an SSO provider
   endpoint in this app. Discourse delegates login to us; we attest
   the atproto identity and a synthesized Discourse-side username.
   Pros: clean account model, one Discourse account per DID,
   mod tools keep working. Cons: requires admin cooperation on
   the Discourse instance and is the most invasive change.
2. **Per-user API key.** User pastes a Discourse API key once; we
   store it server-side encrypted at rest and use it for writes.
   Pros: zero admin cooperation needed. Cons: terrible UX, weak
   security story, abandoned tokens accumulate.
3. **Read-only, forever.** Posting always deep-links into the real
   forum. v1+ is just a nicer reader. This is the cheapest option
   and an honest answer if approach 1 is not feasible.

Recommendation: pursue (1) in parallel with shipping (3) as the
default. Treat (2) as the escape hatch if (1) stalls on access.

## 4. Architecture

```
 ┌───────────────────────┐       ┌────────────────────────────────┐
 │  Browser (SvelteKit)  │  ───▶ │ SvelteKit server routes (BFF)  │
 │   - signed-in: DID    │       │  - Discourse REST client       │
 │   - signed-out: anon  │       │  - response cache (etag, ttl)  │
 └───────────────────────┘       │  - atproto OAuth handler       │
                                 │  - identity resolver           │
                                 └──────┬──────────────┬──────────┘
                                        │              │
                                        ▼              ▼
                          ┌──────────────────┐  ┌─────────────────┐
                          │ Discourse JSON   │  │ atproto PDS /   │
                          │ API (public &    │  │ identity infra  │
                          │ authed endpoints)│  │ (handle → DID,  │
                          └──────────────────┘  │  PLC, com.atp.) │
                                                └─────────────────┘
```

Key choices:

- **SvelteKit is both UI and BFF.** No separate API service. Server
  routes own all Discourse and atproto calls; the browser only ever
  talks to our origin. This keeps the auth story simple (we already
  have a signed `did` cookie) and lets us swap data sources without
  shipping client changes.
- **Discourse is accessed read-mostly without auth.** The site's
  public categories are world-readable, which covers ~all of the
  v1 surface. We add an authenticated Discourse identity only when
  Phase 3 lands.
- **No client-side calls to Discourse.** Going through the BFF lets
  us cache, sanitize, and layer atproto data without exposing the
  user's IP or any tokens to a third-party origin.

## 5. Identity & sessions

We already have:

- atproto OAuth flow (PAR + DPoP + refresh).
- A signed `did` cookie identifying the logged-in user.
- An in-memory `MemoryStore` for OAuth state and sessions.

What needs to change for this project:

- **Persistent session store.** SQLite is fine for v1; the schema is
  small (sessions, oauth state, optional cached identity overlays).
  Pick a single-file embedded store so deploy stays trivial.
- **Identity overlay cache.** Resolving a Discourse username →
  atproto handle → DID → profile record is several hops. Cache the
  resolved record for ~1h, keyed by Discourse username, with
  background refresh on access.
- **Logged-out is the common case.** Most reads are by visitors who
  have not signed in. The UI must be useful and fast without an
  atproto session; sign-in unlocks the overlay and (later) posting.

## 6. Data flow examples

### Loading a topic page (`/t/<id>`)

1. Server route receives request, reads `did` cookie (may be empty).
2. Fetch `https://discourse.atprotocol.community/t/<id>.json`,
   honoring our cached ETag if present.
3. For each unique `username` in the post stream, resolve the
   identity overlay from cache (or schedule a refresh).
4. Render the topic with handles/avatars swapped where overlays
   exist; everyone else falls back to the Discourse avatar/username.
5. Stream the response; defer below-the-fold posts to a follow-up
   fetch if the thread is long.

### Resolving an overlay for username `alice`

1. Cache hit? Return.
2. Fetch `…/u/alice.json`, look at `user_fields[atproto_handle]`.
3. If present, resolve handle → DID via standard atproto resolution
   (DNS TXT or `/.well-known/atproto-did`).
4. Fetch the actor's `app.bsky.actor.profile` from their PDS for
   avatar + display name.
5. Store the `{username, handle, did, avatar, displayName,
   verifiedAt}` tuple in the overlay cache.

If any step fails, cache a negative result with a shorter TTL so we
do not hammer the resolver for users who never linked an account.

## 7. Production gaps (carry-overs from Phase 0)

These are not new to this project but block any real deploy:

- Replace `MemoryStore` in `src/lib/server/oauth/stores.ts` with a
  persistent backend (SQLite or Redis).
- Confirm `PUBLIC_URL`, `COOKIE_SECRET`, and `PRIVATE_JWK_*` are
  injected from secrets, not committed.
- Decide on a deploy target (Fly, Railway, a VM — anything that
  runs `adapter-node` works). Edge deploy is awkward because of the
  DPoP key material.

## 8. Open questions

- **Hosting.** Where does this run, who pays for it, what's the
  domain? (e.g. `dx.atprotocol.community`?) Until we have a domain,
  client-metadata in production cannot be finalized.
- **Discourse access.** Do we need to coordinate with the forum's
  admins for rate-limit headroom or an SSO integration? Phase 1 is
  fine on public endpoints, but Phase 3 needs a conversation.
- **Linking UX.** Self-declared `user_fields[atproto_handle]` is the
  cheap path. Is reciprocal verification worth the extra surface
  before we know anyone uses this?
- **Generalization.** Eventually someone will ask "can it browse
  *my* Discourse?" The architecture above does not preclude that
  but v1 hard-codes one origin to keep scope small.

## 9. Out of scope (for now)

- Notifications, DMs, drafts, bookmarks.
- Admin/mod tools.
- Federating posts back into atproto as `app.bsky.feed.post` or a
  custom lexicon. (Interesting, but a separate project.)
- Migrating away from Discourse. We are an alt-frontend, not a
  successor.
