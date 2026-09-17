/**
 * Synchronous queue store readers.
 *
 * `readQueue` is the module's canonical read: it normalizes the raw
 * `queue` row into `QueueState` (raw-row tolerant, includes the persisted
 * `currentTrackId`). `resolveCurrentPlayingSongId` queries the queue table
 * directly (non-reactive) for call sites that already hold a store instance.
 */

import { queryDb } from '@livestore/livestore'
import type { LiveStore } from '../accessor'
import { tables } from '../schema'
import { parseIds, resolveCurrentSongId } from './resolution'
import type { QueueState } from './types'

/**
 * Read the current queue from LiveStore.
 * Includes the persisted currentTrackId column so callers can
 * prefer it over the index-based fallback.
 * Returns the shared QueueState shape (raw-row tolerant).
 */
export const readQueue = async (store: LiveStore): Promise<QueueState | null> => {
  try {
    const query = queryDb(
      tables.queue
        .select()
        .where('id', '=', 'default')
        .limit(1)
    )

    const result = await store.query(query)

    // queryDb returns array of objects directly
    const row = Array.isArray(result) ? result[0] : null

    if (!row) {
      return null
    }

    return {
      trackIds: parseIds(row.trackIds),
      randomTrackIds: parseIds(row.randomTrackIds),
      currentPlaying: row.currentPlaying as number | null,
      currentTrackId: (row.currentTrackId as string) || null,
      shuffle: Boolean(row.shuffle),
      repeat: Boolean(row.repeat),
    }
  } catch (error) {
    console.error('[readQueue] Error:', error)
    return null
  }
}

/**
 * Resolve the current playing song ID by querying the queue table directly.
 * Uses resolveCurrentSongId on the fetched row so the same resolution logic
 * (currentTrackId authority, shuffle fallback) applies everywhere.
 */
export function resolveCurrentPlayingSongId(
  liveStore: () => LiveStore | null
): string | null {
  const store = liveStore()
  if (!store) return null

  const result = store.query({
    query: `SELECT trackIds, randomTrackIds, currentPlaying, currentTrackId, shuffle FROM queue WHERE id = ?`,
    // Positional array bind — object-form binds are mangled into named
    // params and never reach the placeholder (livestore-bind-contract.spec).
    bindValues: ['default'],
  }) as Array<{
    trackIds?: string | readonly string[]
    randomTrackIds?: string | readonly string[]
    currentPlaying?: number | null
    currentTrackId?: string | null
    shuffle?: boolean
  }>

  const row = result[0]
  if (!row) return null
  return resolveCurrentSongId({
    trackIds: row.trackIds ?? [],
    randomTrackIds: row.randomTrackIds ?? [],
    currentPlaying: row.currentPlaying,
    currentTrackId: row.currentTrackId,
    shuffle: row.shuffle ?? false,
  })
}
