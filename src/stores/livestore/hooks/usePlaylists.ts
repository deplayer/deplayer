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
  return (result as unknown as Record<string, unknown>[])[0] || null
}

