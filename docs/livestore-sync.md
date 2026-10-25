# LiveStore sync on Cloudflare (with passkey auth)

Deplayer's data layer is [LiveStore](https://livestore.dev) (pinned at
`0.4.0-dev.22` across all `@livestore/*` packages). Every app event is marked
`Events.synced`, so the whole library/queue/settings state lives in a
LiveStore eventlog. This document describes the multi-device sync backend:
a Cloudflare Worker (`sync-worker/`) using the official
`@livestore/sync-cf` package, with passkey (WebAuthn) authentication that
issues a JWT the sync layer uses as an authorization token.

Anonymous use (no account) is unchanged: the app keeps a local-only LiveStore
per device. Creating a passkey account switches the store to a cloud-backed
store named `user-<userId>`.

## Storage

Events persist in **Durable Object SQLite**, inside the `SyncBackendDO`
created by `@livestore/sync-cf/cf-worker`'s `makeDurableObject`:

- One DO instance per `storeId` (addressed by the storeId hash). Each
  instance owns its own SQLite database.
- The eventlog lives in a table named
  `eventlog_<persistenceFormatVersion>_<storeId>` (see
  `node_modules/@livestore/sync-cf/dist/cf-worker/do/sqlite.js`); a small
  `context` table tracks the store head/epoch.
- The persistence-format version is managed by LiveStore itself; a format
  bump means clients rebuild state from the eventlog, which the backend
  stores opaquely.

**Why not D1?** D1 (Cloudflare's external SQL database) would add a separate
billing unit and a query surface nobody uses: Deplayer never needs to query
synced data server-side, it only needs LiveStore to push/pull the eventlog.
DO SQLite is the `@livestore/sync-cf` default, needs no extra setup, and is
free under Workers plans for moderate usage. If a D1 backend is ever wanted
(server-side queries, offloading storage), `@livestore/sync-cf` supports it
via `storage: { _tag: 'd1', binding }` in the `makeDurableObject` options plus
a D1 binding in `wrangler.toml` — the auth and client layers would be
unaffected.

## Authn flow

The Worker serves two things from one URL: passkey auth routes
(`POST /auth/...`) and the LiveStore sync protocol (WebSocket).

```mermaid
sequenceDiagram
    participant UI as App (Settings)
    participant W as Worker (fetch)
    participant AD as AuthDO
    participant L as LiveStore client
    participant SD as SyncBackendDO

    UI->>W: POST /auth/register/options {name} (or /auth/login/options)
    W->>AD: generate options, store challenge (5 min TTL)
    AD-->>W: {challengeId, options}
    W-->>UI: {challengeId, options}
    Note over UI: WebAuthn ceremony on device
    UI->>W: POST /auth/register/verify (or /auth/login/verify) {challengeId, response}
    W->>AD: verify response, insert user/credential (or bump counter)
    AD-->>W: {userId, name}
    W-->>UI: {userId, name, token (JWT, 30 days)}
    UI->>UI: store session in localStorage, reload

    L->>W: WebSocket sync request, token in URL query<br/>(LiveStore WS transport)
    W->>W: validatePayload: authorizeSync(payload, storeId, JWT_SECRET)
    W->>SD: connect; DO re-checks onPush/onPull
    Note over SD: storeId must equal "user-" + JWT sub
```

Key properties:

- **Tokens are JWTs (HS256)** issued by the Worker after a verified WebAuthn
  ceremony (`sync-worker/src/token.ts`). Lifetime: 30 days. The JWT is signed
  with the `JWT_SECRET` wrangler secret and verified in three places: the
  Worker's `validatePayload` (before the WS upgrade), the DO's `onPush`, and
  the DO's `onPull` (the forwarded payload is raw client input, so the DO
  never trusts the Worker's verdict alone).
- **The storeId is derived from the token, never trusted from the client:**
  `storeId` must equal `user-<sub>`. A client presenting a valid token for
  user A cannot sync user B's store.
- **The token travels in the WebSocket URL query string**, which is how the
  LiveStore WS transport conveys its `syncPayload`
  (`{ syncUrl, authToken? }`).
- **Expired token:** the sync connection is rejected. Local reads and
  writes keep working (the client runs with `onSyncError: 'ignore'`); pending
  events push automatically after the user signs in again.
- Anonymous devices (no session) never open a sync connection: the server
  would reject a store without an `authToken`, so the worker treats it like a
  device with no backend URL configured and keeps the store local-only.
- **Local-only stores confirm their own events.** LiveStore keeps a rollback
  changeset per event in the state database (`__livestore_session_changeset`)
  and only discards it once the sync backend confirms the event. The
  local-only backend (`src/stores/livestore/localOnlySyncBackend.ts`) echoes
  every push back as confirmed; a backend that never confirms grows the state
  database with every commit until the client session can no longer load it
  at boot (`sqlite3.backup failed with rc=7`: the snapshot is copied twice
  into a 2 GiB wasm heap, so the limit is a state db of roughly 1 GB).
- CORS: requests with an `Origin` not in `ALLOWED_ORIGINS` get HTTP 403.
  `RP_ID` must match the site identity the browser knows (production:
  `deplayer.app`; local dev: `localhost`).

## Deploy

```sh
# local development (reads sync-worker/.dev.vars)
npm run worker:dev          # wrangler dev --config sync-worker/wrangler.toml, port 8787

# production
npm run worker:deploy       # wrangler deploy --config sync-worker/wrangler.toml
npx wrangler secret put JWT_SECRET --config sync-worker/wrangler.toml   # 32+ random bytes

# tests (with the dev worker running on 8787)
npm run worker:webauthn      # server-side WebAuthn roundtrip against the live worker
npm run worker:e2e           # two-client LiveStore sync over the worker's WebSocket
```

Configuration lives in `sync-worker/wrangler.toml`:

- `RP_ID` / `RP_NAME` — WebAuthn relying party identity. Set `RP_ID` to the
  exact site identity (e.g. `deplayer.app` in production, `localhost` in
  dev via `.dev.vars`).
- `ALLOWED_ORIGINS` — comma-separated list of origins allowed to call the
  auth routes and open sync connections.
- DO bindings `SYNC_BACKEND_DO` (`SyncBackendDO`) and `AUTH_DO` (`AuthDO`),
  both using the DO SQLite class (`new_sqlite_classes`, migration tag `v1`).
  Future changes that add DO classes need a **new migration tag**
  (`new_sqlite_classes` only applies to new classes; existing ones keep
  their class name).
- Compatibility flags `enable_request_signal` + `nodejs_compat` are required
  by `@livestore/sync-cf` / `@simplewebauthn/server`.
- `account_id` — pinned to the Cloudflare account that hosts deplayer
  (same account/zone as the Pages project and `deplayer.app`), so a bare
  `npm run worker:deploy` targets the right account.

The app picks up the backend from two sources, in priority order:

1. **Settings → Sync → "Sync server URL"** — a per-device stored setting
   (localStorage). Lets any app build point at the user's own worker;
   changing it signs the user out (a JWT only works on the backend that
   issued it).
2. **`VITE_LIVESTORE_SYNC_URL`** (build time, see `.env.example`) — the
   built-in default for the deployment. Set it **before** the Cloudflare
   Pages build (the hosted deplayer.app build points at the hosted worker).

With neither set, the app stays fully local.

The URL is resolved in the page context (the only place with access to
localStorage) and shipped to the LiveStore worker thread via the sync
payload — a module worker cannot read localStorage, so the worker never
resolves the setting itself.

## Hosted vs self-hosted

- **Hosted backend (default):** users of the deplayer.app build sync through
  the hosted worker. Each passkey registration creates a private account —
  one store per user (`user-<userId>`), one JWT per device (30 days); no
  data is shared between users (see "Key properties" above). The flow is
  Settings → Sync → enter a name → **Create passkey** (or **Sign in with
  passkey** on subsequent devices).
- **Self-hosted backend:** deploy the `sync-worker/` package to your own
  Cloudflare account:

  ```sh
  npx wrangler login
  # in sync-worker/wrangler.toml: set account_id to yours (or remove the
  # line), RP_ID to your app's domain (or localhost), ALLOWED_ORIGINS to
  # your app's origin
  npx wrangler deploy --config sync-worker/wrangler.toml
  npx wrangler secret put JWT_SECRET --config sync-worker/wrangler.toml
  ```

  then connect the app to it either by building with
  `VITE_LIVESTORE_SYNC_URL=https://<your-worker>`, or from any existing
  build via Settings → Sync → "Sync server URL" (stored setting). In the
  latter case the worker must be configured for the app's site identity:
  `RP_ID` must be the domain the app runs on and that origin must be in
  `ALLOWED_ORIGINS` (e.g. to self-host while using the hosted deplayer.app
  frontend, set `RP_ID=deplayer.app` and `ALLOWED_ORIGINS=https://deplayer.app`).

## Export & migration

- **Anonymous → account:** data is *not* moved automatically. Use the
  existing Settings → Actions **Export collection** on the anonymous device,
  sign in (passkey), then **Import collection** on the signed-in store. The
  same flow works in reverse for leaving an account.
- **Server-side export:** there is no `wrangler d1`-equivalent dump for DO
  SQLite — the eventlog is only reachable through LiveStore itself. A
  headless client can pull it: `sync-worker/test/sync-e2e.ts` shows the
  pattern (Node client via `@livestore/adapter-node` +
  `makeWsSync({ url })`, with a minted token).
- **LiveStore persistence-format bumps** are transparent to the backend:
  state is rebuilt from the eventlog by whichever client version reads it,
  per the format version stored in the table name.

## LiveStore release stability

- `0.4.0-dev.22` is a **pre-release dev tag**. The `@livestore/sync-cf`
  subpath exports and option shapes changed between the 0.3 and 0.4 lines
  (e.g. `makeDurableObject`/`handleSyncRequest` signatures,
  `initialSyncOptions`), so the backend and the client must be upgraded
  **together**: keep every `@livestore/*` package (livestore, react,
  sync-cf, adapter-*, common-cf) on the exact same version, and re-verify
  `sync-worker` + the app against the new release before shipping.
- The Worker's wrangler compatibility date and the
  `@cloudflare/workers-types` pin are coupled to
  `@livestore/common-cf`'s dependency — do not "upgrade"
  `@cloudflare/workers-types` on its own (the repo's `.npmrc` uses
  `legacy-peer-deps` for exactly this reason).

## Known limits

- **Settings events are synced**, including provider API credentials stored
  in LiveStore settings. They go to the *user's own* store only (token
  binding), but treat a passkey as full account access: anyone with the
  device/passkey can read them. There is no per-field exclusion today.
- **Large batches:** mass imports fire one `mediaBulkAdded` event per
  batch; a slow device re-pulls the whole batch on reconnect. Batching size
  is a client-side concern (`src/stores/livestore`), not a backend limit.
- **Dev-mode sync testing:** LiveStore computes a materializer "purity"
  hash in non-production environments and compares it when pulling events.
  Materializers that embed `Date.now()` (the app's do) produce a different
  hash on every re-materialization, so two dev-mode clients syncing the
  same event log raise `MaterializerHashMismatchError` (the pull is
  aborted and, with `onSyncError: 'ignore'`, sync silently stops). Test
  sync with a production build (`npm run build && npm run preview`) or run
  node-based clients with `NODE_ENV=production` (see `worker:e2e`). The
  check is skipped entirely when `NODE_ENV=production`.
- **DO callback rejection:** `handleSyncRequest` is called without an `env`
  argument in `sync-worker/src/worker.ts` (the full `Env` type makes the
  sync-cf branded RPC types recurse — `TS2589`). The runtime falls back to
  the same global env object, and `syncBackendBinding` is therefore checked
  as a plain `string` rather than the binding literal. If a future
  `@livestore/sync-cf` release makes the DO `onPush`/`onPull` callbacks
  unable to reject, `validatePayload` (pre-WS-upgrade) remains the
  authorization boundary.
- **WebAuthn requires a secure context and a registered `RP_ID`**; local
  dev uses `localhost` with the browser's virtual authenticator (DevTools →
  WebAuthn).
- **Automated passkey ceremony:** the WebAuthn ceremony cannot be driven in
  headless or agent-managed browsers (headless fails WebAuthn's page-focus
  requirement; the virtual authenticator in managed headful browsers is
  flaky). The auth routes are instead verified by `npm run worker:webauthn`,
  which drives the live Worker's `/auth/*` HTTP API with cryptographically
  valid fabricated P-256 responses (origin checks, challenge lifecycle,
  credential verification, JWT `sub`). Do one real passkey registration in
  your own browser against local dev before relying on it in production.
- 30-day tokens: a device that never signs in again keeps pushing pending
  local events only after it re-authenticates; the anonymous store is never
  touched by an account store.
