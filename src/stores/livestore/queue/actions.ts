/**
 * Thin adapters over the pure rules in `./transitions` (list-mutating
 * actions) and `./stepping` (position advances). Each action: input guard
 * → read the head row (and, for advances, only the needed `queue_items`
 * rows) → rule → commit the returned event only when non-null. All
 * queue-domain logic (shuffle reordering, repeat wrap, position clamping,
 * active-list selection) lives in the pure modules so it is testable
 * without a LiveStore.
 *
 * Side effects (audio playback, notifications) remain in Redux saga.
 * All actions require a store parameter from useStore() hook.
 *
 * The console.warn messages and the commit-await asymmetries below are
 * preserved VERBATIM from the original actions (including the
 * fire-and-forget commit on the addToQueue fresh-create path).
 */

import { queryDb } from '@livestore/livestore'
import type { LiveStore } from '../accessor'
import { queueEvents } from '../events/queue'
import { tables } from '../schema'
import { addNext, playAll, addToQueue, clearQueue, removeFromQueue, toggleShuffle, toggleRepeat, setCurrentPlaying } from './transitions'
import { readQueue, storedPermutation } from './storeReaders'
import { stepNext, stepPrevious, stepToMedia } from './stepping'
import { activeIndexToOrderedIndex, orderedIndexToActiveIndex } from './resolution'
import { ORDERED_LIST } from './types'
import type { ActiveRow, QueueHeadRow, QueueItemRow } from './types'

/**
 * Replace queue with new tracks, positioned at the first track.
 *
 * @param store - LiveStore instance
 * @param trackIds - Array of media IDs to play
 */
export const playAllAction = async (store: LiveStore, trackIds: string[]): Promise<void> => {
  if (!trackIds || trackIds.length === 0) {
    console.warn('playAllAction: No tracks provided')
    return
  }

  // Replace entire queue. The current action does not read the queue first;
  // the transition takes no current state, matching that.
  const ev = playAll(trackIds)
  if (ev) {
    await store.commit(queueEvents.queueUpdated(ev))
  }
}

/**
 * Add tracks to end of queue
 *
 * @param store - LiveStore instance
 * @param trackIds - Array of media IDs to add
 */
export const addToQueueAction = async (store: LiveStore, trackIds: string[]) => {
  if (!trackIds || trackIds.length === 0) {
    return
  }

  const current = await readQueue(store)
  const ev = addToQueue(current, trackIds)
  if (!ev) return

  if (current === null) {
    // Fresh-create path commits without await (preserved from current code).
    store.commit(queueEvents.queueUpdated(ev))
  } else {
    // Append path awaits the commit (preserved from current code).
    await store.commit(queueEvents.queueUpdated(ev))
  }
}

/**
 * Add tracks to queue after currently playing track (Play Next)
 *
 * @param store - LiveStore instance
 * @param trackIds - Array of media IDs to add next
 * @returns First track ID for saga to potentially start playback
 */
export const addNextAction = async (store: LiveStore, trackIds: string[]) => {
  if (!trackIds || trackIds.length === 0) {
    return null
  }

  const current = await readQueue(store)
  const r = addNext(current, trackIds)
  if (r) {
    await store.commit(queueEvents.queueUpdated(r.event))
    return r.firstTrackId
  }
  return null
}

/**
 * Remove a track from the queue
 *
 * @param store - LiveStore instance
 * @param trackId - Media ID to remove
 */
export const removeFromQueueAction = async (store: LiveStore, trackId: string) => {
  const current = await readQueue(store)
  // The transition commits even when the track was absent (no-op commit),
  // matching the current action which has no absence guard.
  const ev = removeFromQueue(current, trackId)
  if (ev) {
    await store.commit(queueEvents.queueUpdated(ev))
  }
}

/**
 * Clear the entire queue
 *
 * @param store - LiveStore instance
 */
export const clearQueueAction = async (store: LiveStore) => {
  // The current action reads nothing and commits unconditionally; preserved.
  await store.commit(queueEvents.queueCleared(clearQueue()))
}

/**
 * Toggle shuffle mode (Spotify-style)
 *
 * - Current song keeps playing uninterrupted
 * - Only affects next/previous navigation order
 * - currentPlaying index updates to point to same song in new array
 *
 * @param store - LiveStore instance
 * @param shuffle - New shuffle state
 */
export const toggleShuffleAction = async (store: LiveStore, shuffle: boolean) => {
  const current = await readQueue(store)

  // Single warn path for both "no queue" and "empty queue" (the transition
  // returns null in both cases).
  if (!current || current.trackIds.length === 0) {
    console.warn('[toggleShuffleAction] No queue or empty queue, cannot toggle shuffle')
    return
  }

  const ev = toggleShuffle(current, shuffle)
  if (ev) {
    await store.commit(queueEvents.queueShuffleToggled(ev))
  }
}

/**
 * Toggle repeat mode
 *
 * @param store - LiveStore instance
 * @param repeat - New repeat state
 */
export const toggleRepeatAction = async (store: LiveStore, repeat: boolean) => {
  const current = await readQueue(store)

  if (!current) {
    console.warn('[toggleRepeatAction] No queue exists, cannot toggle repeat')
    return
  }

  const ev = toggleRepeat(current, repeat)
  if (ev) {
    await store.commit(queueEvents.queueRepeatToggled(ev))
  }
}

/**
 * Set currently playing position
 *
 * @param store - LiveStore instance
 * @param position - Index in queue to play
 */
export const setCurrentPlayingAction = async (store: LiveStore, position: number) => {
  // The current action reads nothing; preserved.
  await store.commit(queueEvents.queuePositionChanged(setCurrentPlaying(position)))
}

/**
 * Play next song in queue
 * Increments currentPlaying index or loops if repeat is on
 *
 * @param store - LiveStore instance
 * @returns false when there is nothing to advance to (end of queue with repeat off, or no queue)
 */
export async function playNextAction(store: LiveStore): Promise<boolean> {
  const head = await readQueueHead(store)

  if (!head) {
    console.warn(`[playNextAction] Queue default not found`)
    return false
  }

  const cur = head.currentPlaying ?? -1
  const [atNext, atZero] = await Promise.all([
    readActiveRow(store, head, cur + 1),
    readActiveRow(store, head, 0),
  ])

  const ev = stepNext(head, atNext, atZero)
  if (!ev) return false
  await store.commit(queueEvents.queuePositionChanged(ev))
  return true
}

/**
 * Play previous song in queue
 * Decrements currentPlaying index or loops if repeat is on
 *
 * @param store - LiveStore instance
 */
export async function playPreviousAction(store: LiveStore): Promise<void> {
  const head = await readQueueHead(store)

  if (!head) {
    console.warn(`[playPreviousAction] Queue default not found`)
    return
  }

  const cur = head.currentPlaying ?? 0
  const atPrev = cur > 0 ? await readActiveRow(store, head, cur - 1) : null
  // The wrap row is only fetched when the step can use it, so the common case
  // (stepping back from a queue with repeat off) costs one point read.
  const last = atPrev === null && head.repeat ? await readLastActiveRow(store, head) : null

  // Always commits when a queue exists (even the stay-put case).
  const ev = stepPrevious(head, atPrev, last)
  if (ev) {
    await store.commit(queueEvents.queuePositionChanged(ev))
  }
}

/**
 * Play a specific song by ID
 * Finds the song in the queue and sets currentPlaying to its index
 *
 * @param store - LiveStore instance
 * @param mediaId - Song ID to play
 */
export async function playMediaAction(
  store: LiveStore,
  mediaId: string
): Promise<void> {
  const head = await readQueueHead(store)

  if (!head) {
    console.warn(`[playMediaAction] Queue default not found`)
    return
  }

  const found = (
    await store.query(
      queryDb(
        tables.queueItems
          .select('position', 'trackId')
          .where('queueId', '=', 'default')
          .where('list', '=', ORDERED_LIST)
          .where('trackId', '=', mediaId)
          .limit(1)
      )
    )
  )[0] ?? null

  // The query yields an ordered index; the event must carry the active-list
  // position (what currentPlaying indexes when shuffle is on).
  const perm = headPermutation(head)
  const active: ActiveRow | null = found
    ? { position: orderedIndexToActiveIndex(perm, found.position), trackId: found.trackId }
    : null

  const ev = stepToMedia(active)
  if (ev) {
    await store.commit(queueEvents.queuePositionChanged(ev))
  } else {
    console.warn(`[playMediaAction] Media ${mediaId} not found in queue`)
  }
}

/**
 * Point-read helpers for the O(1) step actions.
 *
 * `queue_items` holds only the ordered list; the shuffle order is a
 * permutation on the head row. A step therefore maps its active-list position
 * through that permutation and reads exactly one ordered row — the head row
 * plus at most two row reads, no full-list materialization.
 */

const readQueueHead = async (store: LiveStore): Promise<QueueHeadRow | null> => {
  const result = (await store.query(
    queryDb(
      tables.queue
        .select()
        .where('id', '=', 'default')
        .limit(1)
    )
  ))
  return result[0] ?? null
}

/** The head row's shuffle permutation, or null when the active list is ordered. */
const headPermutation = (head: QueueHeadRow): Int32Array | null =>
  storedPermutation(head.shuffle, head.randomOrder)

/** Point-read the ordered row at an ordered-list index. */
const readOrderedRow = async (
  store: LiveStore,
  position: number
): Promise<Pick<QueueItemRow, 'position' | 'trackId'> | null> => {
  const result = (await store.query(
    queryDb(
      tables.queueItems
        .select('position', 'trackId')
        .where('queueId', '=', 'default')
        .where('list', '=', ORDERED_LIST)
        .where('position', '=', position)
        .limit(1)
    )
  ))
  return result[0] ?? null
}

/**
 * Point-read the row occupying an active-list position. The returned row
 * carries the *active* position, so the pure stepping rules commit it as-is.
 */
const readActiveRow = async (
  store: LiveStore,
  head: QueueHeadRow,
  activePosition: number
): Promise<ActiveRow | null> => {
  const orderedIndex = activeIndexToOrderedIndex(headPermutation(head), activePosition)
  const row = await readOrderedRow(store, orderedIndex)
  return row ? { position: activePosition, trackId: row.trackId } : null
}

/**
 * The row at the last active-list position (the repeat wrap for a back step).
 * Under shuffle the permutation length already gives that position, so no
 * extra query is needed.
 */
const readLastActiveRow = async (
  store: LiveStore,
  head: QueueHeadRow
): Promise<ActiveRow | null> => {
  const perm = headPermutation(head)
  if (perm) {
    const activePosition = perm.length - 1
    if (activePosition < 0) return null
    return readActiveRow(store, head, activePosition)
  }

  const last = (
    await store.query(
      queryDb(
        tables.queueItems
          .select('position', 'trackId')
          .where('queueId', '=', 'default')
          .where('list', '=', ORDERED_LIST)
          .orderBy('position', 'desc')
          .limit(1)
      )
    )
  )[0] ?? null
  return last ? { position: last.position, trackId: last.trackId } : null
}
