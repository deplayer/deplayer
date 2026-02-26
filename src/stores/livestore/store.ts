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
  
  // Generate unique ID with fallback for older browsers that don't support crypto.randomUUID()
  let newId: string
  try {
    // Try modern Web Crypto API first
    if ('crypto' in window && typeof window.crypto?.randomUUID === 'function') {
      newId = crypto.randomUUID()
    } else {
      // Fallback to timestamp + random value for older environments
      const timestamp = Date.now().toString(36)
      const randomPart = Math.random().toString(36).substring(2, 11)
      newId = `${timestamp}-${randomPart}`
    }
  } catch (e) {
    // Last resort fallback - use localStorage key itself with a prefix to avoid conflicts
    newId = 'livestore-store-' + Date.now()
  }

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
