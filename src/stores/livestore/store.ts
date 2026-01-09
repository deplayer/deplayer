import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import LiveStoreWorker from './livestore.worker?worker'
import { schema } from './schema.js'

// Generate a consistent store ID (can be improved to use user ID or similar)
const getStoreId = (): string => {
  // Try to get from localStorage, or generate a new one
  const stored = localStorage.getItem('livestore-store-id')
  if (stored) {
    return stored
  }
  const newId = crypto.randomUUID()
  localStorage.setItem('livestore-store-id', newId)
  return newId
}

export const storeId = getStoreId()

// Create adapter with OPFS storage
// OPFS requires Cross-Origin-Embedder-Policy and Cross-Origin-Opener-Policy headers
export const adapter = makePersistedAdapter({
  storage: { type: 'opfs' },
  worker: LiveStoreWorker,
  sharedWorker: LiveStoreSharedWorker,
})

export { schema }
