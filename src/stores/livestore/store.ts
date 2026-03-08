import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import { useStore } from '@livestore/react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import LiveStoreWorker from './livestore.worker?worker'
import { schema } from './schema.js'

// Generate a consistent store ID (can be improved to use user ID or similar)
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

export const storeId = getStoreId()

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
    storeId,
    schema,
    adapter,
    batchUpdates,
  })

export { schema }
