import { createStorePromise } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { schema } from './schema'
import { nanoid } from '@livestore/livestore'

/**
 * Creates a test LiveStore instance with in-memory adapter
 * Useful for unit tests that need a LiveStore without persisting data
 */
export const createTestStore = async () => {
  const adapter = makeInMemoryAdapter()
  
  const store = await createStorePromise({
    storeId: nanoid(),
    adapter,
    schema,
  })
  
  return store
}

/**
 * Helper to wait for LiveStore queries to settle in tests
 */
export const waitForQueries = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}
