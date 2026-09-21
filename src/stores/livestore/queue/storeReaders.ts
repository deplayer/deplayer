/**
 * Synchronous queue store readers.
 *
 * `readQueue` is the module's canonical read: it assembles the normalized
 * `QueueState` from the `queue` head row plus the `queue_items` rows.
 * `resolveCurrentPlayingSongId` queries the tables directly (non-reactive)
 * for call sites that already hold a store instance.
 */

import { queryDb } from '@livestore/livestore'
import type { LiveStore } from '../accessor'
import { tables } from '../schema'
import type { QueueHeadRow, QueueItemRow, QueueState } from './types'

/**
 * Assemble the normalized `QueueState` from the head row and item rows.
 * Shared by `readQueue` and the `useQueue` hook so both reads stay in
 * sync. Returns null when there is no head row.
 */
export const assembleQueueState = (
  head: QueueHeadRow | null | undefined,
  itemRows: readonly QueueItemRow[],
): QueueState | null => {
  if (!head) return null
  const trackIds = itemRows
    .filter((r) => r.list === 'ordered')
    .sort((a, b) => a.position - b.position)
    .map((r) => r.trackId)
  const randomTrackIds = itemRows
    .filter((r) => r.list === 'random')
    .sort((a, b) => a.position - b.position)
    .map((r) => r.trackId)
  return {
    trackIds,
    randomTrackIds,
    currentPlaying: head.currentPlaying,
    currentTrackId: head.currentTrackId || null,
    shuffle: Boolean(head.shuffle),
    repeat: Boolean(head.repeat),
  }
}

/**
 * Read the current queue from LiveStore.
 * Head row plus item rows; returns the shared QueueState shape (raw-row
 * tolerant). Includes the persisted currentTrackId column so callers can
 * prefer it over the index-based fallback.
 */
export const readQueue = async (store: LiveStore): Promise<QueueState | null> => {
  try {
    const headResult = await store.query(
      queryDb(
        tables.queue
          .select()
          .where('id', '=', 'default')
          .limit(1)
      )
    )

    const head = (headResult as unknown as QueueHeadRow[])?.[0] ?? null
    if (!head) {
      return null
    }

    const itemResult = await store.query(
      queryDb(
        tables.queueItems
          .select('list', 'position', 'trackId')
          .where('queueId', '=', 'default')
          .orderBy('list', 'asc')
          .orderBy('position', 'asc')
      )
    )

    return assembleQueueState(head, itemResult as unknown as QueueItemRow[])
  } catch (error) {
    console.error('[readQueue] Error:', error)
    return null
  }
}

/**
 * Resolve the current playing song ID by querying the queue tables
 * directly. The persisted currentTrackId is authoritative when present;
 * otherwise the active position is resolved with a point read of
 * `queue_items` (shuffle-aware list selection).
 */
export function resolveCurrentPlayingSongId(
  liveStore: () => LiveStore | null
): string | null {
  const store = liveStore()
  if (!store) return null

  const result = store.query({
    query: `SELECT currentTrackId, currentPlaying, shuffle FROM queue WHERE id = ?`,
    // Positional array bind — object-form binds are mangled into named
    // params and never reach the placeholder (livestore-bind-contract.spec).
    bindValues: ['default'],
  }) as Array<{
    currentPlaying?: number | null
    currentTrackId?: string | null
    shuffle?: boolean
  }>

  const row = result[0]
  if (!row) return null
  const currentTrackId = row.currentTrackId ?? null
  if (currentTrackId) return currentTrackId

  const currentPlaying = row.currentPlaying
  if (currentPlaying === null || currentPlaying === undefined) return null

  const list = row.shuffle ? 'random' : 'ordered'
  const item = store.query({
    query: 'SELECT trackId FROM queue_items WHERE queueId = ? AND list = ? AND position = ?',
    bindValues: ['default', list, currentPlaying],
  }) as Array<{ trackId?: string | null }>
  return item[0]?.trackId ?? null
}
