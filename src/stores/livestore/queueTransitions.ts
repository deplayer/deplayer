/**
 * Pure queue transition functions.
 *
 * These are the mutation-side domain logic for the playback queue, extracted
 * from `actions/queue.ts` so they can be tested without a LiveStore. Each
 * function takes the current queue state (`null` = no queue row) and returns
 * the journal event payload to commit, or `null` when no commit should occur.
 *
 * Purity boundary: imports ONLY from `./hooks/queueUtils` (type + pure
 * helpers). No `events/queue.ts`, no `schema.ts`, no store access. The event
 * payload types below mirror the schemas in `events/queue.ts` so the module
 * stays decoupled from the LiveStore event factory.
 *
 * Two suspected bugs in the original actions are preserved EXACTLY and are
 * deliberately NOT fixed here (see the per-function comments and the
 * accompanying spec). The point of this refactor is behavior preservation,
 * not behavior change.
 */
import type { QueueState } from './hooks/queueUtils'
import { getActiveTrackIds, parseIds } from './hooks/queueUtils'

export type { QueueState } from './hooks/queueUtils'

// ============================================================================
// Event payload types — mirror the schemas in `events/queue.ts` exactly.
// ============================================================================

export type QueueUpdatedEvent = {
  id: string
  trackIds: readonly string[]
  randomTrackIds?: readonly string[]
  currentPlaying?: number
  shuffle: boolean
  repeat: boolean
}

export type QueuePositionChangedEvent = {
  queueId: string
  position: number
  trackId?: string
}

export type QueueRepeatToggledEvent = {
  queueId: string
  repeat: boolean
}

export type QueueClearedEvent = {
  queueId: string
}

export type QueueTransitionEvent =
  | QueueUpdatedEvent
  | QueuePositionChangedEvent
  | QueueRepeatToggledEvent
  | QueueClearedEvent

// ============================================================================
// Derived values
// ============================================================================

/**
 * Compute the currently-playing track ID from queue state.
 *
 * This is the exact formula the `v1.QueueUpdated` materializer in `schema.ts`
 * currently owns inline: the active list is `randomTrackIds` when shuffle is
 * on (falling back to `trackIds` when `randomTrackIds` is absent), otherwise
 * `trackIds`. Returns `null` when there is no valid current track.
 *
 * NOTE: the fallback is `randomTrackIds ?? trackIds` (NOT `?? []`) to keep the
 * materializer's behavior byte-for-byte identical. When shuffle is on but
 * `randomTrackIds` is missing (e.g. the append path that omits it), the
 * current song resolves against the original `trackIds` list.
 */
export function deriveCurrentTrackId(
  trackIds: readonly string[],
  randomTrackIds: readonly string[] | undefined,
  currentPlaying: number | null | undefined,
  shuffle: boolean | undefined,
): string | null {
  const active = shuffle ? (randomTrackIds ?? trackIds) : trackIds
  if (
    currentPlaying == null ||
    currentPlaying < 0 ||
    active.length === 0 ||
    currentPlaying >= active.length
  ) {
    return null
  }
  return active[currentPlaying]
}

/**
 * Fisher-Yates shuffle with an injected RNG (for deterministic tests).
 * Port of the private `shuffleArray` from `actions/queue.ts`.
 */
export function fisherYates<T>(array: readonly T[], random: () => number): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// ============================================================================
// Transitions
// ============================================================================

/**
 * Replace the queue with new tracks, positioned at the first track.
 * The current action does not read the queue before committing, so this
 * transition takes no current state.
 */
export function playAll(trackIds: readonly string[]): QueueUpdatedEvent | null {
  if (trackIds.length === 0) return null
  return {
    id: 'default',
    trackIds,
    currentPlaying: 0,
    shuffle: false,
    repeat: false,
  }
}

/**
 * Append tracks to the end of the queue.
 *
 * SUSPECTED BUG #1 (preserved intentionally): when appending to an existing
 * queue, `randomTrackIds` is deliberately OMITTED. The materializer's
 * `onConflict` then resets it to `[]`, wiping the shuffle order while
 * `shuffle` stays `true`. Do NOT "fix" here — the spec locks this in.
 */
export function addToQueue(
  current: QueueState | null,
  trackIds: readonly string[],
): QueueUpdatedEvent | null {
  if (trackIds.length === 0) return null

  if (current === null) {
    return {
      id: 'default',
      trackIds,
      currentPlaying: undefined,
      shuffle: false,
      repeat: false,
    }
  }

  const currentIds = parseIds(current.trackIds)
  return {
    id: 'default',
    trackIds: [...currentIds, ...trackIds],
    currentPlaying: current.currentPlaying ?? undefined,
    // bug #1: randomTrackIds intentionally omitted (shuffle order wiped).
    shuffle: current.shuffle ?? false,
    repeat: current.repeat ?? false,
  }
}

/**
 * Insert tracks after the currently-playing track (Play Next).
 * Returns the first inserted track ID for a fresh queue (so the caller can
 * start playback), `null` when appending to an existing queue.
 */
export function addNext(
  current: QueueState | null,
  trackIds: readonly string[],
): { event: QueueUpdatedEvent; firstTrackId: string | null } | null {
  if (trackIds.length === 0) return null

  if (current === null) {
    return {
      event: {
        id: 'default',
        trackIds,
        currentPlaying: 0,
        shuffle: false,
        repeat: false,
      },
      firstTrackId: trackIds[0] ?? null,
    }
  }

  const currentIds = parseIds(current.trackIds)
  const cp = current.currentPlaying
  const insertPosition = cp == null ? 0 : cp + 1
  return {
    event: {
      id: 'default',
      trackIds: [
        ...currentIds.slice(0, insertPosition),
        ...trackIds,
        ...currentIds.slice(insertPosition),
      ],
      currentPlaying: current.currentPlaying ?? undefined,
      // randomTrackIds intentionally omitted (same bug #1 site as addToQueue).
      shuffle: current.shuffle ?? false,
      repeat: current.repeat ?? false,
    },
    firstTrackId: null,
  }
}

/**
 * Remove a track from the queue (removes ALL occurrences — current behavior).
 * Commits even when the track was absent (no-op commit), matching the
 * current action which has no absence guard.
 */
export function removeFromQueue(
  current: QueueState | null,
  trackId: string,
): QueueUpdatedEvent | null {
  if (current === null) return null

  const currentIds = parseIds(current.trackIds)
  const newTrackIds = currentIds.filter((id) => id !== trackId)

  // Clamp currentPlaying DOWN when it now points past the end of the list.
  // currentPlaying is number | null here: readQueue always normalizes it, and
  // the null case is handled by the `!== null` guard (undefined is not
  // distinguishable from null in this narrowing, which is fine for a clamp).
  let newCurrentPlaying: number | null = current.currentPlaying ?? null
  if (newCurrentPlaying !== null && newCurrentPlaying >= newTrackIds.length) {
    newCurrentPlaying = newTrackIds.length > 0 ? newTrackIds.length - 1 : null
  }

  return {
    id: 'default',
    trackIds: newTrackIds,
    currentPlaying: newCurrentPlaying ?? undefined,
    shuffle: current.shuffle ?? false,
    repeat: current.repeat ?? false,
  }
}

/**
 * Clear the entire queue. The current action reads nothing and commits
 * unconditionally, so this takes no state and never returns null.
 */
export function clearQueue(): QueueClearedEvent {
  return { queueId: 'default' }
}

/**
 * Toggle shuffle mode (Spotify-style): the current song keeps playing, only
 * the next/previous navigation order changes. `currentPlaying` is re-indexed
 * to point at the same song in the new order.
 *
 * SUSPECTED BUG #2 (preserved intentionally): the ENABLE path anchors the
 * current song on `trackIds[currentPlaying]` (the original order), NOT on the
 * active list. A queue whose `currentPlaying` indexes `randomTrackIds`
 * (already shuffled in a previous session) would anchor on the wrong song
 * when re-enabled. Do NOT "fix" here.
 */
export function toggleShuffle(
  current: QueueState | null,
  shuffle: boolean,
  random: () => number = Math.random,
): QueueUpdatedEvent | null {
  if (current === null) return null
  const trackIds = parseIds(current.trackIds)
  if (trackIds.length === 0) return null

  if (shuffle) {
    // ENABLE SHUFFLE: generate a new random order, keep the same song playing.
    const randomTrackIds = fisherYates(trackIds, random)

    let newCurrentPlaying = current.currentPlaying
    if (current.currentPlaying !== null && current.currentPlaying !== undefined) {
      // bug #2: anchor on trackIds[currentPlaying], not the active list.
      const currentTrackId = trackIds[current.currentPlaying]
      const indexInShuffled = randomTrackIds.indexOf(currentTrackId)
      if (indexInShuffled !== -1) {
        newCurrentPlaying = indexInShuffled
      }
    }

    return {
      id: 'default',
      trackIds,
      randomTrackIds,
      currentPlaying: newCurrentPlaying ?? undefined,
      shuffle: true,
      repeat: current.repeat ?? false,
    }
  }

  // DISABLE SHUFFLE: re-index currentPlaying back into the original order.
  let newCurrentPlaying = current.currentPlaying
  const randomIds = parseIds(current.randomTrackIds)
  if (
    current.currentPlaying !== null &&
    current.currentPlaying !== undefined &&
    randomIds.length > 0
  ) {
    const currentTrackId = randomIds[current.currentPlaying]
    const indexInOriginal = trackIds.indexOf(currentTrackId)
    if (indexInOriginal !== -1) {
      newCurrentPlaying = indexInOriginal
    }
  }

  return {
    id: 'default',
    trackIds,
    randomTrackIds: [],
    currentPlaying: newCurrentPlaying ?? undefined,
    shuffle: false,
    repeat: current.repeat ?? false,
  }
}

/**
 * Toggle repeat mode. The current action reads the queue only to warn when it
 * is missing; the event itself is a partial `queueRepeatToggled`.
 */
export function toggleRepeat(
  current: QueueState | null,
  repeat: boolean,
): QueueRepeatToggledEvent | null {
  if (current === null) return null
  return { queueId: 'default', repeat }
}

/**
 * Set the currently-playing position. The current action reads nothing and
 * commits a partial `queuePositionChanged`, so this takes no state and never
 * returns null.
 */
export function setCurrentPlaying(position: number): QueuePositionChangedEvent {
  return { queueId: 'default', position }
}

/**
 * Advance to the next track. At the end with repeat on, wraps to 0. At the
 * end with repeat off, returns `null` (no commit; playback stops).
 */
export function playNext(
  current: QueueState | null,
): QueuePositionChangedEvent | null {
  if (current === null) return null
  const active = getActiveTrackIds(current)
  if (active.length === 0) return null

  const currentIndex = current.currentPlaying ?? -1
  const nextIndex = currentIndex + 1

  if (nextIndex < active.length) {
    return { queueId: 'default', position: nextIndex, trackId: active[nextIndex] }
  }
  if (current.repeat && active.length > 0) {
    return { queueId: 'default', position: 0, trackId: active[0] }
  }
  return null
}

/**
 * Go to the previous track. Always commits when a queue exists (even the
 * stay-put case at the start with repeat off). Returns `null` only when there
 * is no queue.
 */
export function playPrevious(
  current: QueueState | null,
): QueuePositionChangedEvent | null {
  if (current === null) return null
  const active = getActiveTrackIds(current)
  const currentIndex = current.currentPlaying ?? 0
  const prevIndex = currentIndex - 1

  let newPosition: number
  if (prevIndex >= 0) {
    newPosition = prevIndex
  } else if (current.repeat && active.length > 0) {
    newPosition = active.length - 1
  } else {
    newPosition = 0
  }

  // Edge: empty active list → active[newPosition] is undefined → trackId
  // is undefined; the current code behaves identically (trackId optional).
  return { queueId: 'default', position: newPosition, trackId: active[newPosition] }
}

/**
 * Play a specific track by ID (resolves its position in the active list).
 * Returns `null` when the track is not in the queue.
 */
export function playMedia(
  current: QueueState | null,
  mediaId: string,
): QueuePositionChangedEvent | null {
  if (current === null) return null
  const active = getActiveTrackIds(current)
  const index = active.indexOf(mediaId)
  if (index === -1) return null
  return { queueId: 'default', position: index, trackId: mediaId }
}
