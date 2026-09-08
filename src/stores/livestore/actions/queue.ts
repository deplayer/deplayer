import { queryDb } from '@livestore/livestore'
import type { LiveStore } from '../accessor'
import { tables } from '../schema'
import { queueEvents } from '../events/queue'
import type { QueueState } from '../queueTransitions'
import {
  playAll,
  addToQueue,
  addNext,
  removeFromQueue,
  clearQueue,
  toggleShuffle,
  toggleRepeat,
  setCurrentPlaying,
  playNext,
  playPrevious,
  playMedia,
} from '../queueTransitions'
import { parseIds } from '../hooks/queueUtils'

/**
 * LiveStore Queue Actions
 *
 * Thin adapters over the pure transition functions in `queueTransitions.ts`.
 * Each action: input guard → (optional) readQueue → transition → commit the
 * returned event only when non-null. All queue-domain logic (shuffle
 * reordering, repeat wrap, position clamping, active-list selection) lives in
 * the pure module so it is testable without a LiveStore.
 *
 * Side effects (audio playback, notifications) remain in Redux saga.
 * All actions require a store parameter from useStore() hook.
 */

const QUEUE_ID = 'default'

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
        .where('id', '=', QUEUE_ID)
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
 * @param queueId - Queue ID (default: 'default')
 */
export async function playNextAction(
  store: LiveStore,
  queueId = QUEUE_ID
): Promise<void> {
  const queue = await readQueue(store)

  if (!queue) {
    console.warn(`[playNextAction] Queue ${queueId} not found`)
    return
  }

  const ev = playNext(queue)
  if (ev) {
    await store.commit(queueEvents.queuePositionChanged(ev))
  }
}

/**
 * Play previous song in queue
 * Decrements currentPlaying index or loops if repeat is on
 *
 * @param store - LiveStore instance
 * @param queueId - Queue ID (default: 'default')
 */
export async function playPreviousAction(
  store: LiveStore,
  queueId = QUEUE_ID
): Promise<void> {
  const queue = await readQueue(store)

  if (!queue) {
    console.warn(`[playPreviousAction] Queue ${queueId} not found`)
    return
  }

  // Always commits when a queue exists (even the stay-put case).
  const ev = playPrevious(queue)
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
 * @param queueId - Queue ID (default: 'default')
 */
export async function playMediaAction(
  store: LiveStore,
  mediaId: string,
  queueId = QUEUE_ID
): Promise<void> {
  const queue = await readQueue(store)

  if (!queue) {
    console.warn(`[playMediaAction] Queue ${queueId} not found`)
    return
  }

  const ev = playMedia(queue, mediaId)
  if (ev) {
    await store.commit(queueEvents.queuePositionChanged(ev))
  } else {
    console.warn(`[playMediaAction] Media ${mediaId} not found in queue`)
  }
}
