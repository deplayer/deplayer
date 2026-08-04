import { Store } from '@livestore/livestore'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LiveStore = Store<any>

let liveStoreInstance: LiveStore | null = null

/**
 * Get the LiveStore instance for imperative access (sagas, services).
 * Called inside StoreRegistryProvider → returns the reactive store.
 * Returns null during boot before the store is mounted.
 */
export const getLiveStoreInstance = (): LiveStore | null => liveStoreInstance

/**
 * Set the LiveStore instance after initialization.
 * Called once from App.tsx when useAppStore() resolves.
 */
export const setLiveStoreInstance = (store: LiveStore) => {
  liveStoreInstance = store
}
