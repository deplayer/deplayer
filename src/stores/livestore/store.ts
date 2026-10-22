import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import { getSyncUrl } from '../../services/syncAuth/config'
import { getSyncSession } from '../../services/syncAuth/session'
import { useStore } from '@livestore/react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import LiveStoreWorker from './livestore.worker?worker'
import { schema } from './schema.js'

// Generate a consistent anonymous store ID (used until a sync account is signed in)
const getStoreId = (): string => {
  const stored = localStorage.getItem('livestore-store-id')
  if (stored) {
    return stored
  }

  let newId: string
  try {
    if ('crypto' in window && typeof window.crypto?.randomUUID === 'function') {
      newId = crypto.randomUUID()
    } else {
      const timestamp = Date.now().toString(36)
      const randomPart = Math.random().toString(36).substring(2, 11)
      newId = `${timestamp}-${randomPart}`
    }
  } catch (e) {
    newId = 'livestore-store-' + Date.now()
  }

  localStorage.setItem('livestore-store-id', newId)
  return newId
}

let cachedStoreId: string | null = null
const resolveStoreId = (): string => {
  if (!cachedStoreId) {
    const session = getSyncSession()
    cachedStoreId = session ? `user-${session.userId}` : getStoreId()
  }
  return cachedStoreId
}

/**
 * The sync payload shipped to the worker at store start and sent with every
 * push/pull:
 * - `syncUrl` — the active backend URL. Module workers cannot read
 *   localStorage, so the URL is carried through the payload; when no URL is
 *   configured (no stored setting, no build-time default) this payload is
 *   `undefined` and the worker runs the store local-only.
 * - `authToken` — the passkey session JWT (only when signed in).
 */
const resolveSyncPayload = (): Record<string, string> | undefined => {
  const syncUrl = getSyncUrl()
  if (syncUrl === undefined) {
    return undefined
  }
  const payload: Record<string, string> = { syncUrl }
  const session = getSyncSession()
  if (session !== null) {
    payload.authToken = session.token
  }
  return payload
}

// v0.4: makePersistedAdapter automatically falls back to single-tab mode
// when SharedWorker is unavailable (e.g. Android Chrome).
const adapter = makePersistedAdapter({
  storage: { type: 'opfs' },
  worker: LiveStoreWorker,
  sharedWorker: LiveStoreSharedWorker,
})

/**
 * Hook to access the app's LiveStore instance.
 * Uses the new v0.4 multi-store API via StoreRegistry.
 * Suspends until the store is loaded.
 */
export const useAppStore = () =>
  useStore({
    storeId: resolveStoreId(),
    schema,
    adapter,
    batchUpdates,
    syncPayload: resolveSyncPayload(),
  })

export { schema }
