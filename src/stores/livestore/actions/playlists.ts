import type { LiveStore } from '../accessor'
import { events } from '../schema'

/**
 * Current ordered track ids of a playlist, or null when no head row exists.
 *
 * Tracks live one row per track in `playlist_items`; `playlistReordered`
 * still carries the whole array, so mutating actions must read it first.
 */
const readPlaylistTrackIds = async (
  store: LiveStore,
  playlistId: string
): Promise<string[] | null> => {
  const head = (await store.query({
    query: 'SELECT id FROM playlists WHERE id = ?',
    bindValues: [playlistId],
  })) as Array<{ id?: string }>
  if (!head[0]) return null

  const rows = (await store.query({
    query: 'SELECT trackId FROM playlist_items WHERE playlistId = ? ORDER BY position ASC',
    bindValues: [playlistId],
  })) as Array<{ trackId?: string }>
  return rows.flatMap((row) => (row.trackId ? [row.trackId] : []))
}

/**
 * LiveStore Playlists Actions
 *
 * These actions handle playlist CRUD operations and track management.
 * For track add/remove operations, we follow the pattern established in schema.ts:
 * 1. Read current trackIds from the playlist
 * 2. Modify the array (add/remove/reorder)
 * 3. Dispatch PlaylistReordered event with the updated trackIds
 *
 * All actions require a store parameter from useStore() hook.
 */

/**
 * Create a new playlist
 * 
 * @param store - LiveStore instance from useStore()
 * @param name - Playlist name
 * @returns The generated playlist ID
 */
export const createPlaylistAction = async (store: LiveStore, name: string): Promise<string> => {
  const id = `playlist-${Date.now()}`
  store.commit(events.playlistCreated({ id, name }))
  return id
}

/**
 * Rename an existing playlist
 * 
 * @param store - LiveStore instance from useStore()
 * @param playlistId - Playlist ID to rename
 * @param name - New playlist name
 */
export const renamePlaylistAction = async (store: LiveStore, playlistId: string, name: string) => {
  store.commit(events.playlistRenamed({ playlistId, name }))
}

/**
 * Add a track to a playlist
 * Follows the pattern from schema.ts materializers:
 * 1. Read current trackIds
 * 2. Add new trackId at specified position (or end)
 * 3. Dispatch PlaylistReordered event
 * 
 * @param store - LiveStore instance from useStore()
 * @param playlistId - Playlist ID to add track to
 * @param trackId - Media track ID to add
 * @param position - Optional position to insert at (defaults to end)
 */
export const addTrackToPlaylistAction = async (
  store: LiveStore,
  playlistId: string,
  trackId: string,
  position?: number
) => {
  // Read current trackIds (one row per track in playlist_items).
  const currentTrackIds = await readPlaylistTrackIds(store, playlistId)
  if (currentTrackIds === null) {
    console.warn(`Playlist ${playlistId} not found`)
    return
  }
  
  // Add track at position
  let newTrackIds: string[]
  if (position !== undefined && position >= 0 && position <= currentTrackIds.length) {
    newTrackIds = [
      ...currentTrackIds.slice(0, position),
      trackId,
      ...currentTrackIds.slice(position)
    ]
  } else {
    // Append to end
    newTrackIds = [...currentTrackIds, trackId]
  }
  
  // Dispatch reordered event with updated trackIds
  store.commit(events.playlistReordered({ playlistId, trackIds: newTrackIds }))
}

/**
 * Remove a track from a playlist
 * Follows the pattern from schema.ts materializers:
 * 1. Read current trackIds
 * 2. Remove trackId (all occurrences)
 * 3. Dispatch PlaylistReordered event
 * 
 * @param store - LiveStore instance from useStore()
 * @param playlistId - Playlist ID to remove track from
 * @param trackId - Media track ID to remove
 */
export const removeTrackFromPlaylistAction = async (
  store: LiveStore,
  playlistId: string,
  trackId: string
) => {
  // Read current trackIds (one row per track in playlist_items).
  const currentTrackIds = await readPlaylistTrackIds(store, playlistId)
  if (currentTrackIds === null) {
    console.warn(`Playlist ${playlistId} not found`)
    return
  }
  
  // Remove all occurrences of trackId
  const newTrackIds = currentTrackIds.filter(id => id !== trackId)
  
  // Dispatch reordered event with updated trackIds
  store.commit(events.playlistReordered({ playlistId, trackIds: newTrackIds }))
}

/**
 * Reorder tracks in a playlist
 * 
 * @param store - LiveStore instance from useStore()
 * @param playlistId - Playlist ID to reorder
 * @param trackIds - New ordered array of track IDs
 */
export const reorderPlaylistAction = async (
  store: LiveStore,
  playlistId: string,
  trackIds: string[]
) => {
  store.commit(events.playlistReordered({ playlistId, trackIds }))
}

/**
 * Delete a playlist
 * 
 * @param store - LiveStore instance from useStore()
 * @param playlistId - Playlist ID to delete
 */
export const deletePlaylistAction = async (store: LiveStore, playlistId: string) => {
  store.commit(events.playlistDeleted({ playlistId }))
}

/**
 * Toggle shuffle mode for a playlist
 * 
 * @param store - LiveStore instance from useStore()
 * @param playlistId - Playlist ID to toggle shuffle
 * @param shuffle - New shuffle state
 */
export const togglePlaylistShuffleAction = async (
  store: LiveStore,
  playlistId: string,
  shuffle: boolean
) => {
  store.commit(events.playlistShuffleToggled({ playlistId, shuffle }))
}

/**
 * Toggle repeat mode for a playlist
 * 
 * @param store - LiveStore instance from useStore()
 * @param playlistId - Playlist ID to toggle repeat
 * @param repeat - New repeat state
 */
export const togglePlaylistRepeatAction = async (
  store: LiveStore,
  playlistId: string,
  repeat: boolean
) => {
  store.commit(events.playlistRepeatToggled({ playlistId, repeat }))
}
