/**
 * Queue Query Hooks
 *
 * These hooks provide reactive access to playback queue data from LiveStore.
 * They automatically update when the underlying data changes.
 *
 * `useQueue` assembles the normalized `QueueState` from the `queue` head
 * row plus the `queue_items` rows (mirroring `readQueue` via the shared
 * `assembleQueueState`). The head row's `randomOrder` permutation supplies
 * `randomTrackIds`; `queue_items` holds only the ordered list.
 */

import { queryDb } from '@livestore/livestore'
import { useAppStore } from '../store'
import { tables } from '../schema'
import { assembleQueueState } from './storeReaders'
import type { QueueState } from './types'

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
  const headResult = store.useQuery(
    queryDb(
      tables.queue
        .select()
        .where('id', '=', queueId)
        .limit(1)
    )
  )
  const itemResult = store.useQuery(
    queryDb(
      tables.queueItems
        .select('list', 'position', 'trackId')
        .where('queueId', '=', queueId)
        .orderBy('position', 'asc')
    )
  )
  return assembleQueueState(headResult[0], itemResult)
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
  // Single-column select plucks: the result is [currentTrackId] or [].
  return result[0] ?? null
}
