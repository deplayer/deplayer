import { useAppStore } from '../store'
import { queryDb } from '@livestore/livestore'
import { tables } from '../schema'

/**
 * Playlist Query Hooks
 * 
 * These hooks provide reactive access to playlist data from LiveStore.
 * They automatically update when the underlying data changes.
 */

/**
 * Get all playlists
 * 
 * @example
 * ```tsx
 * const playlists = usePlaylists()
 * return <div>{playlists.length} playlists</div>
 * ```
 */
export const usePlaylists = () => {
  const store = useAppStore()
  return store.useQuery(
    queryDb(
      tables.playlists
        .select()
        .orderBy('name', 'asc')
    )
  )
}

/**
 * Get a single playlist by ID
 * 
 * @example
 * ```tsx
 * const playlist = usePlaylistById('playlist-123')
 * if (!playlist) return <div>Not found</div>
 * return <div>{playlist.name}</div>
 * ```
 */
export const usePlaylistById = (id: string | null | undefined) => {
  const store = useAppStore()
  const result = store.useQuery(
    queryDb(
      id
        ? tables.playlists.select().where('id', '=', id).limit(1)
        : tables.playlists.select().where('id', '=', '__NONE__').limit(1)
    )
  )
  return (result as any[])[0] || null
}

/**
 * Get tracks for a playlist by expanding the trackIds array
 * This joins with the media table to get full track information
 * 
 * Note: trackIds is stored as a JSON array, so we need to parse it
 * 
 * @example
 * ```tsx
 * const tracks = usePlaylistTracks('playlist-123')
 * return <div>{tracks.length} tracks in this playlist</div>
 * ```
 */
export const usePlaylistTracks = (playlistId: string | null | undefined) => {
  const store = useAppStore()
  // First get the playlist to access trackIds
  const playlist = usePlaylistById(playlistId)
  
  if (!playlist || !playlist.trackIds || (playlist.trackIds as any[]).length === 0) {
    return []
  }
  
  // Parse trackIds (it's a JSON array)
  const trackIds = typeof playlist.trackIds === 'string' 
    ? JSON.parse(playlist.trackIds)
    : playlist.trackIds
  
  // Get media items by their IDs
  // Note: This might not maintain playlist order - we'll need to sort manually
  const media = store.useQuery(
    queryDb(
      tables.media
        .select()
        .where('id', 'IN', trackIds)
    )
  )
  
  // Sort media by playlist order
  const mediaMap = new Map((media as any[]).map(m => [m.id, m]))
  return trackIds
    .map((id: string) => mediaMap.get(id))
    .filter((m: any) => m !== undefined)
}
