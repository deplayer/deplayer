/**
 * Queue Query Hooks
 *
 * These hooks provide reactive access to playback queue data from LiveStore.
 * They automatically update when the underlying data changes.
 *
 * `useQueue` normalizes the raw row into `QueueState` (the single canonical
 * read shape, mirroring `readQueue`).
 */

import { queryDb } from '@livestore/livestore'
import { useAppStore } from '../store'
import { tables } from '../schema'
import { parseIds } from './resolution'
import type { QueueRecord, QueueState } from './types'

/**
 * Get the current queue state
 *
 * Note: There should typically be only one queue with id 'default'
 *
 * @example
 * ```tsx
 * const queue = useQueue()
 * if (!queue) return <div>No queue</div>
 * return <div>{queue.trackIds.length} tracks in queue</div>
 * ```
 */
export const useQueue = (queueId = 'default'): QueueState | null => {
  const store = useAppStore()
  const result = store.useQuery(
    queryDb(
      tables.queue
        .select()
        .where('id', '=', queueId)
        .limit(1)
    )
  )
  const raw = (result as unknown as QueueRecord[])?.[0]
  if (!raw) return null
  return {
    trackIds: parseIds(raw.trackIds),
    randomTrackIds: parseIds(raw.randomTrackIds),
    currentPlaying: raw.currentPlaying,
    currentTrackId: (raw.currentTrackId as string | null) || null,
    shuffle: raw.shuffle,
    repeat: raw.repeat,
  }
}

/**
 * Get the ID of the currently playing song
 * Reads the persisted currentTrackId column
 *
 * @example
 * ```tsx
 * const currentSongId = useCurrentPlayingSongId()
 * if (!currentSongId) return <div>Nothing playing</div>
 * ```
 */
export const useCurrentPlayingSongId = (queueId = 'default'): string | null => {
  const store = useAppStore()
  const result = store.useQuery(
    queryDb(
      tables.queue
        .select('currentTrackId')
        .where('id', '=', queueId)
        .limit(1)
    )
  )
  const row = (result as unknown as Array<{ currentTrackId: string | null }>)?.[0]
  return row?.currentTrackId ?? null
}
