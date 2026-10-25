import { makeWorker } from '@livestore/adapter-web/worker'
import { makeWsSync } from '@livestore/sync-cf/client'
import { makeLocalOnlyBackend } from './localOnlySyncBackend'
import { schema } from './schema.js'

/**
 * LiveStore Worker Configuration
 *
 * Multi-device sync: the page resolves the active sync backend URL — the
 * stored setting from Settings → Sync (per device) or the build-time
 * `VITE_LIVESTORE_SYNC_URL` default (see `.env.example` and
 * `docs/livestore-sync.md`) — and ships it to this worker as
 * `syncPayload.syncUrl` (see `src/stores/livestore/store.ts`). This thread
 * runs as a module worker where `localStorage` is not available, so the
 * sync payload is the only channel for that value.
 *
 * The client attaches the passkey session JWT as `syncPayload.authToken`;
 * the Cloudflare sync worker in `sync-worker/` re-checks it on every
 * push/pull and rejects anonymous or foreign-store traffic.
 *
 * Without a URL, or without a session token (anonymous stores are never
 * synced: the server rejects them), the store is local-only and uses
 * `makeLocalOnlyBackend`, which confirms the device's own events so LiveStore
 * can discard their rollback changesets (offline-first, nothing leaves the
 * device).
 */

/**
 * `makeWsSync` expects a `ws(s)://` URL (it appends its query params to the
 * raw value without converting the scheme), but sync URLs are stored and
 * documented as `http(s)://` origins (they are also used for the `/auth/*`
 * HTTP API). Convert the scheme; `ws(s)://` values pass through unchanged.
 */
const toWsUrl = (url: string): string => url.replace(/^http/i, 'ws')

/** A non-empty string field of the sync payload the page shipped, if any. */
const payloadField = (payload: unknown, key: 'syncUrl' | 'authToken'): string | undefined => {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return undefined
  }
  const candidate = (payload as Record<string, unknown>)[key]
  return typeof candidate === 'string' && candidate !== '' ? candidate : undefined
}

makeWorker({
  schema,

  sync: {
    /**
     * Per-store-start backend constructor: the page ships the active
     * backend URL in the sync payload (module workers cannot read
     * localStorage). Without a URL or a session token the store runs
     * local-only.
     */
    backend: ({ storeId, clientId, payload }) => {
      const url = payloadField(payload, 'syncUrl')
      if (url === undefined || payloadField(payload, 'authToken') === undefined) {
        return makeLocalOnlyBackend()
      }
      return makeWsSync({ url: toWsUrl(url) })({ storeId, clientId, payload })
    },

    /**
     * Initial sync behavior on app boot:
     * - Skip: Don't wait for sync (instant app start, offline-first)
     * - Blocking: Wait for sync to complete (ensures data consistency, slower start)
     *
     * 'Skip' for best performance.
     */
    initialSyncOptions: { _tag: 'Skip' },

    /**
     * Error handling during sync:
     * - 'ignore': Log error, continue as if offline (graceful degradation)
     * - 'shutdown': Stop app on sync error (strict data consistency)
     *
     * 'ignore' so a rejected connection (e.g. anonymous store, expired
     * token) or a dead backend never breaks the app.
     */
    onSyncError: 'ignore',
  },
})
