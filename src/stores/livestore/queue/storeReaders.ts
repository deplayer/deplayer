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
import { activeIndexToOrderedIndex, activeOrderPermutation, permutationToTrackIds } from './resolution'
import { ORDERED_LIST } from './types'
import type { QueueHeadRow, QueueItemRow, QueueState } from './types'

/**
 * Decode the stored shuffle permutation, warning when a present blob is
 * unusable. A malformed blob means the stored format changed under us, so it
 * must not degrade silently into "unshuffled".
 */
export const storedPermutation = (
  shuffle: boolean | null | undefined,
  randomOrder: unknown,
): Int32Array | null => {
  const perm = activeOrderPermutation(shuffle, randomOrder)
  if (perm === null && shuffle && randomOrder != null) {
    console.warn('[queue] randomOrder blob could not be decoded; using the ordered list')
  }
  return perm
}

/**
 * Assemble the normalized `QueueState` from the head row and item rows.
 * Shared by `readQueue` and the `useQueue` hook so both reads stay in sync.
 * Returns null when there is no head row.
 *
 * `queue_items` holds only the ordered list; the shuffle order is rebuilt by
 * mapping the head row's `randomOrder` permutation back through that list.
 * Shuffle with no stored permutation degrades to the ordered list, matching
 * `deriveCurrentTrackId`, so the active list the UI renders is the same one
 * the step actions walk.
 *
 * Memoized on the input references: `useQuery` hands back the same row
 * arrays across re-renders that the query did not cause, so a re-render
 * (a progress tick, a keystroke) no longer rebuilds a 60k-element list.
 */
export const assembleQueueState = (
  head: QueueHeadRow | null | undefined,
  itemRows: readonly QueueItemRow[],
): QueueState | null => {
  if (cache && cache.head === head && cache.itemRows === itemRows) return cache.state
  const state = buildQueueState(head, itemRows)
  cache = { head, itemRows, state }
  return state
}

let cache: {
  head: QueueHeadRow | null | undefined
  itemRows: readonly QueueItemRow[]
  state: QueueState | null
} | null = null

const buildQueueState = (
  head: QueueHeadRow | null | undefined,
  itemRows: readonly QueueItemRow[],
): QueueState | null => {
  if (!head) return null
  const trackIds = itemRows
    .filter((r) => r.list === ORDERED_LIST)
    .sort((a, b) => a.position - b.position)
    .map((r) => r.trackId)

  const perm = storedPermutation(head.shuffle, head.randomOrder)
  const randomTrackIds = !head.shuffle
    ? []
    : perm
      ? permutationToTrackIds(trackIds, perm)
      : [...trackIds]

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
 * otherwise the active position is mapped through the shuffle permutation
 * (when shuffle is on) to an ordered index, then point-read from
 * `queue_items`.
 */
export function resolveCurrentPlayingSongId(
  liveStore: () => LiveStore | null
): string | null {
  const store = liveStore()
  if (!store) return null

  const result = store.query({
    query: `SELECT currentTrackId, currentPlaying, shuffle, randomOrder FROM queue WHERE id = ?`,
    // Positional array bind — object-form binds are mangled into named
    // params and never reach the placeholder (livestore-bind-contract.spec).
    bindValues: ['default'],
  }) as Array<{
    currentPlaying?: number | null
    currentTrackId?: string | null
    shuffle?: boolean
    randomOrder?: unknown
  }>

  const row = result[0]
  if (!row) return null
  const currentTrackId = row.currentTrackId ?? null
  if (currentTrackId) return currentTrackId

  const currentPlaying = row.currentPlaying
  if (currentPlaying === null || currentPlaying === undefined) return null

  // currentPlaying indexes the active list; the rows are the ordered list.
  const index = activeIndexToOrderedIndex(
    storedPermutation(row.shuffle, row.randomOrder),
    currentPlaying,
  )
  const item = store.query({
    query: 'SELECT trackId FROM queue_items WHERE queueId = ? AND list = ? AND position = ?',
    bindValues: ['default', ORDERED_LIST, index],
  }) as Array<{ trackId?: string | null }>
  return item[0]?.trackId ?? null
}
