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
import { readQueue } from './storeReaders'
import { activeListName, stepNext, stepPrevious, stepToMedia } from './stepping'
import type { QueueHeadRow, QueueItemRow } from './types'

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
    await store.commit(queueEvents.queueUpdated(ev))
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
 */
export async function playNextAction(store: LiveStore): Promise<void> {
  const head = await readQueueHead(store)

  if (!head) {
    console.warn(`[playNextAction] Queue default not found`)
    return
  }

  const list = activeListName(head.shuffle)
  const cur = head.currentPlaying ?? -1
  const [atNext, atZero] = await readItemRows(store, list, cur + 1, 0)

  const ev = stepNext(head, atNext, atZero)
  if (ev) {
    await store.commit(queueEvents.queuePositionChanged(ev))
  }
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

  const list = activeListName(head.shuffle)
  const cur = head.currentPlaying ?? 0
  const [atPrev, last] = await readPrevRows(store, list, cur, head.repeat)

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

  const list = activeListName(head.shuffle)
  const found = (
    await store.query(
      queryDb(
        tables.queueItems
          .select('position', 'trackId')
          .where('queueId', '=', 'default')
          .where('list', '=', list)
          .where('trackId', '=', mediaId)
          .limit(1)
      )
    ) as unknown as QueueItemRow[]
  )[0] ?? null

  const ev = stepToMedia(found)
  if (ev) {
    await store.commit(queueEvents.queuePositionChanged(ev))
  } else {
    console.warn(`[playMediaAction] Media ${mediaId} not found in queue`)
  }
}

/**
 * Point-read helpers for the O(1) step actions.
 *
 * Each reads at most two `queue_items` rows — only the neighbors a step
 * actually needs — plus the head row. No JSON parsing, no full-list
 * materialization.
 */

const readQueueHead = async (store: LiveStore): Promise<QueueHeadRow | null> => {
  const result = (await store.query(
    queryDb(
      tables.queue
        .select()
        .where('id', '=', 'default')
        .limit(1)
    )
  )) as unknown as QueueHeadRow[]
  return result[0] ?? null
}

const readItem = async (
  store: LiveStore,
  list: string,
  position: number
): Promise<QueueItemRow | null> => {
  const result = (await store.query(
    queryDb(
      tables.queueItems
        .select('position', 'trackId')
        .where('queueId', '=', 'default')
        .where('list', '=', list)
        .where('position', '=', position)
        .limit(1)
    )
  )) as unknown as QueueItemRow[]
  return result[0] ?? null
}

const readItemRows = async (
  store: LiveStore,
  list: string,
  ...positions: number[]
): Promise<(QueueItemRow | null)[]> => {
  const rows = await Promise.all(positions.map((p) => readItem(store, list, p)))
  return rows
}

/**
 * The previous step needs the row at `cur - 1` (when `cur > 0`) and, for
 * the repeat wrap, the highest-position row in the active list. The wrap row
 * is only fetched when the step can actually use it, so the common case
 * (stepping back from a queue with repeat off) costs one point read.
 */
const readPrevRows = async (
  store: LiveStore,
  list: string,
  cur: number,
  repeat: boolean
): Promise<[QueueItemRow | null, QueueItemRow | null]> => {
  const atPrev = cur > 0 ? await readItem(store, list, cur - 1) : null
  if (atPrev !== null || !repeat) return [atPrev, null]

  const last = (
    await store.query(
      queryDb(
        tables.queueItems
          .select('position', 'trackId')
          .where('queueId', '=', 'default')
          .where('list', '=', list)
          .orderBy('position', 'desc')
          .limit(1)
      )
    ) as unknown as QueueItemRow[]
  )[0] ?? null
  return [atPrev, last]
}
