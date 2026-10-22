import { makeAdapter } from '@livestore/adapter-node'
import { createStorePromise, type Store } from '@livestore/livestore'
import { schema } from '../stores/livestore/schema'

export type TestLiveStore = Store<typeof schema>

let storeCount = 0

/**
 * A real in-memory LiveStore with the app schema, so tests see the row
 * shapes queries actually return (e.g. single-column selects pluck to
 * plain values). Shut it down with `store.shutdownPromise()`.
 */
export const makeTestStore = (): Promise<TestLiveStore> =>
  createStorePromise({
    schema,
    adapter: makeAdapter({ storage: { type: 'in-memory' } }),
    // LiveStore accepts only alphanumerics, `_` and `-` in store ids.
    storeId: `test-store-${++storeCount}`,
  })

/**
 * Stand-in for `useAppStore()` backed by a real store. `useQuery` reads
 * synchronously and is not reactive: call `rerender()` after commits.
 *
 * @example
 * vi.mock('../store', () => ({ useAppStore: () => appStoreFor(store) }))
 */
export const appStoreFor = (store: TestLiveStore) => ({
  useQuery: (query: Parameters<TestLiveStore['query']>[0]) => store.query(query),
})
