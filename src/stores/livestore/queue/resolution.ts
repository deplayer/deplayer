/**
 * Pure queue resolution functions.
 *
 * The read-side domain logic for the playback queue: parsing stored id
 * lists, selecting the active list (shuffle-aware), resolving the
 * current/next/previous track, and deriving the persisted currentTrackId.
 *
 * Purity boundary: imports ONLY from `./types`. No LiveStore, no
 * `schema.ts`, no `events/queue.ts`, no React. Testable without any
 * infrastructure.
 */

import type { QueueState } from './types'

/**
 * Parse a trackIds field that may be a JSON string or already an array.
 */
export function parseIds(ids: readonly string[] | string | null | undefined): string[] {
  if (!ids) return []
  if (Array.isArray(ids)) return ids as string[]
  try {
    return JSON.parse(ids as string)
  } catch {
    return []
  }
}

/**
 * Get the active track list based on shuffle state.
 * When shuffle is on, currentPlaying indexes into randomTrackIds.
 * Returns an empty array when queue is null or undefined.
 */
export function getActiveTrackIds(queue: QueueState | null | undefined): string[] {
  if (!queue) return []
  return queue.shuffle
    ? parseIds(queue.randomTrackIds)
    : parseIds(queue.trackIds)
}

/**
 * Resolve queue.currentPlaying (index) to the actual song ID.
 * Returns null when there is no valid current track.
 */
export function resolveCurrentSongId(queue: QueueState | null | undefined): string | null {
  if (!queue) return null

  // Persisted currentTrackId is authoritative when present (computed by
  // the schema materializer from the active shuffle order). Fall back to
  // the index-based resolution for legacy rows.
  if (queue.currentTrackId) return queue.currentTrackId

  if (queue.currentPlaying === null || queue.currentPlaying === undefined) {
    return null
  }
  const ids = getActiveTrackIds(queue)
  return ids[queue.currentPlaying] || null
}

/**
 * Compute next/previous song IDs from queue state.
 */
export function resolveQueueNavigation(queue: QueueState | null | undefined): {
  nextSongId: string | null
  prevSongId: string | null
} {
  if (!queue || queue.currentPlaying === null || queue.currentPlaying === undefined) {
    return { nextSongId: null, prevSongId: null }
  }

  const activeTrackIds = getActiveTrackIds(queue)
  const currentIndex = queue.currentPlaying
  const nextIndex = currentIndex + 1
  const prevIndex = currentIndex - 1

  let nextSongId: string | null = null
  let prevSongId: string | null = null

  if (nextIndex < activeTrackIds.length) {
    nextSongId = activeTrackIds[nextIndex]
  } else if (queue.repeat && activeTrackIds.length > 0) {
    nextSongId = activeTrackIds[0]
  }

  if (prevIndex >= 0) {
    prevSongId = activeTrackIds[prevIndex]
  } else if (queue.repeat && activeTrackIds.length > 0) {
    prevSongId = activeTrackIds[activeTrackIds.length - 1]
  }

  return { nextSongId, prevSongId }
}

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
 * Port of the private `shuffleArray` from the original queue actions.
 */
export function fisherYates<T>(array: readonly T[], random: () => number): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
