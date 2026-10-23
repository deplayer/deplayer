import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import { getSyncUrl } from '../../services/syncAuth/config'
import { getSyncSession } from '../../services/syncAuth/session'
import { useStore, type ReactApi } from '@livestore/react'
import type { Store } from '@livestore/livestore'
import { createContext, createElement, use, type ReactNode } from 'react'
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

/** The app's loaded LiveStore with the React API (`useQuery`, …) attached. */
export type AppStore = Store<typeof schema> & ReactApi

const AppStoreContext = createContext<AppStore | null>(null)

/**
 * Loads the app's LiveStore once (suspends until ready) and shares it.
 * Must sit inside StoreRegistryProvider and a Suspense boundary.
 *
 * Every `useAppStore()` consumer reads this context instead of calling
 * `useStore` itself: each `useStore` mount resolves the store through the
 * registry's Effect runtime and retains it in an effect — several ms per
 * call, paid ~4x by every virtualized row mounted while scrolling.
 */
export const AppStoreProvider = ({ children }: { children: ReactNode }) => {
  const store = useStore({
    storeId: resolveStoreId(),
    schema,
    adapter,
    batchUpdates,
    syncPayload: resolveSyncPayload(),
  })
  return createElement(AppStoreContext, { value: store }, children)
}

/**
 * Hook to access the app's LiveStore instance provided by AppStoreProvider.
 */
export const useAppStore = (): AppStore => {
  const store = use(AppStoreContext)
  if (!store) throw new Error('useAppStore must be used inside <AppStoreProvider>')
  return store
}

export { schema }
