/**
 * Pure utility functions for queue index resolution.
 *
 * Extracted from hooks so the critical index→trackId logic
 * is testable without React or LiveStore.
 */

export interface QueueState {
  trackIds: string[] | string
  randomTrackIds?: string[] | string
  currentPlaying: number | null | undefined
  shuffle?: boolean
  repeat?: boolean
}

/**
 * Parse a trackIds field that may be a JSON string or already an array.
 */
export function parseIds(ids: string[] | string | null | undefined): string[] {
  if (!ids) return []
  if (Array.isArray(ids)) return ids
  try {
    return JSON.parse(ids)
  } catch {
    return []
  }
}

/**
 * Get the active track list based on shuffle state.
 * When shuffle is on, currentPlaying indexes into randomTrackIds.
 */
export function getActiveTrackIds(queue: QueueState): string[] {
  return queue.shuffle
    ? parseIds(queue.randomTrackIds)
    : parseIds(queue.trackIds)
}

/**
 * Resolve queue.currentPlaying (index) to the actual song ID.
 * Returns null when there is no valid current track.
 */
export function resolveCurrentSongId(queue: QueueState | null | undefined): string | null {
  if (!queue || queue.currentPlaying === null || queue.currentPlaying === undefined) {
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
