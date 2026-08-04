/**
 * Pure utility functions for queue index resolution.
 *
 * Extracted from hooks so the critical index→trackId logic
 * is testable without React or LiveStore.
 */
import type { LiveStore } from '../accessor'

export interface QueueState {
  trackIds: readonly string[] | string
  randomTrackIds?: readonly string[] | string
  currentPlaying: number | null | undefined
  currentTrackId?: string | null
  shuffle?: boolean
  repeat?: boolean
}

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
 * Resolve the current playing song ID by querying the queue table directly.
 * Uses resolveCurrentSongId on the fetched row so the same resolution logic
 * (currentTrackId authority, shuffle fallback) applies everywhere.
 */
export function resolveCurrentPlayingSongId(
  liveStore: () => LiveStore | null
): string | null {
  const store = liveStore()
  if (!store) return null

  const result = store.query({
    query: `SELECT trackIds, randomTrackIds, currentPlaying, currentTrackId, shuffle FROM queue WHERE id = ?`,
    bindValues: { 1: 'default' }
  }) as Array<{
    trackIds?: string | readonly string[]
    randomTrackIds?: string | readonly string[]
    currentPlaying?: number | null
    currentTrackId?: string | null
    shuffle?: boolean
  }>

  const row = result[0]
  if (!row) return null
  return resolveCurrentSongId({
    trackIds: row.trackIds ?? [],
    randomTrackIds: row.randomTrackIds ?? [],
    currentPlaying: row.currentPlaying,
    currentTrackId: row.currentTrackId,
    shuffle: row.shuffle ?? false,
  })
}
