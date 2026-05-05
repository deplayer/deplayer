import { Store } from '@livestore/livestore'
import { events } from '../schema'

/**
 * LiveStore Smart Playlists Actions
 *
 * These actions handle smart playlist CRUD operations.
 * Smart playlists are filter-based and dynamically generate
 * their track lists based on genres, artists, types, and providers.
 *
 * All actions require a store parameter from useStore() hook.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LiveStore = Store<any>

type SmartPlaylistFilters = {
  genres: string[]
  types: string[]
  artists: string[]
  providers: string[]
}

/**
 * Create a new smart playlist
 * 
 * @param store - LiveStore instance from useStore()
 * @param name - Smart playlist name
 * @param filters - Filters object with genres, types, artists, providers arrays
 * @returns The generated smart playlist ID
 */
export const createSmartPlaylistAction = async (
  store: LiveStore,
  name: string,
  filters: SmartPlaylistFilters
): Promise<string> => {
  const id = `smart-playlist-${Date.now()}`
  store.commit(events.smartPlaylistCreated({ id, name, filters }))
  return id
}

/**
 * Delete a smart playlist
 * 
 * @param store - LiveStore instance from useStore()
 * @param smartPlaylistId - Smart playlist ID to delete
 */
export const deleteSmartPlaylistAction = async (
  store: LiveStore,
  smartPlaylistId: string
) => {
  store.commit(events.smartPlaylistDeleted({ smartPlaylistId }))
}
