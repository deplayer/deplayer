import { useMemo } from 'react'
import { useAppStore } from '../store'
import { queryDb } from '@livestore/livestore'
import { tables } from '../schema'
import { NO_MATCH_ID } from '../query'

/**
 * Playlist Query Hooks
 *
 * Playlist tracks live one row per track in `playlist_items`, so both hooks
 * read the head row(s) plus the item rows and assemble the `trackIds` array
 * the UI expects — the same head + items split the queue uses.
 */

type PlaylistItemRow = {
  playlistId: string
  position: number
  trackId: string
}

/** A playlist head row plus the `trackIds` assembled from its item rows. */
export type PlaylistRow = {
  id: string
  name: string
  shuffle: boolean
  repeat: boolean
  currentPlaying: number | null
  createdAt: number
  updatedAt: number
  trackIds: string[]
}

/**
 * Track ids of every playlist, grouped in a single pass, each bucket in
 * stored order.
 */
const groupTrackIds = (items: readonly PlaylistItemRow[]): Map<string, string[]> => {
  const grouped = new Map<string, PlaylistItemRow[]>()
  for (const item of items) {
    const bucket = grouped.get(item.playlistId)
    if (bucket) bucket.push(item)
    else grouped.set(item.playlistId, [item])
  }

  const trackIds = new Map<string, string[]>()
  for (const [playlistId, bucket] of grouped) {
    trackIds.set(
      playlistId,
      bucket.sort((a, b) => a.position - b.position).map((item) => item.trackId)
    )
  }
  return trackIds
}

/**
 * Get all playlists, each with its assembled `trackIds`.
 *
 * @example
 * ```tsx
 * const playlists = usePlaylists()
 * return <div>{playlists.length} playlists</div>
 * ```
 */
export const usePlaylists = (): PlaylistRow[] => {
  const store = useAppStore()
  const rows = store.useQuery(
    queryDb(tables.playlists.select().orderBy('name', 'asc'))
  )
  const items = store.useQuery(
    queryDb(
      tables.playlistItems
        .select('playlistId', 'position', 'trackId')
        .orderBy('position', 'asc')
    )
  )

  return useMemo(() => {
    const byPlaylist = groupTrackIds(items)
    return rows.map((row) => ({
      ...row,
      trackIds: byPlaylist.get(row.id) ?? [],
    }))
  }, [rows, items])
}

/**
 * Get a single playlist by ID, with its assembled `trackIds`.
 *
 * @example
 * ```tsx
 * const playlist = usePlaylistById('playlist-123')
 * if (!playlist) return <div>Not found</div>
 * return <div>{playlist.name}</div>
 * ```
 */
export const usePlaylistById = (id: string | null | undefined): PlaylistRow | null => {
  const store = useAppStore()
  const rows = store.useQuery(
    queryDb(
      id
        ? tables.playlists.select().where('id', '=', id).limit(1)
        : tables.playlists.select().where('id', '=', NO_MATCH_ID).limit(1)
    )
  )
  const items = store.useQuery(
    queryDb(
      tables.playlistItems
        .select('playlistId', 'position', 'trackId')
        .where('playlistId', '=', id ?? NO_MATCH_ID)
        .orderBy('position', 'asc')
    )
  )

  return useMemo(() => {
    const row = rows[0]
    if (!row) return null
    return {
      ...row,
      trackIds: groupTrackIds(items).get(row.id) ?? [],
    }
  }, [rows, items])
}
