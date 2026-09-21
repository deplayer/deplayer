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

import type { PermutationBlob, QueueState } from './types'

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

/**
 * Ordered-index permutation helpers.
 *
 * The shuffle order is persisted as a permutation of *indices* into the
 * ordered list (the `randomOrder` blob on the `queue` head row), not as a
 * second set of `queue_items` rows. Toggling shuffle therefore writes one
 * head row instead of the whole track list, while advance navigation still
 * point-reads the single ordered row a step needs.
 */

/** Encode a permutation of ordered indices as the stored Int32 LE blob. */
export function encodePermutation(indices: readonly number[]): PermutationBlob {
  const out = new Int32Array(indices.length)
  for (let i = 0; i < indices.length; i++) out[i] = indices[i] ?? -1
  return new Uint8Array(out.buffer)
}

/**
 * Decode the stored permutation blob. Tolerates a `Uint8Array` (what the
 * SQLite layer returns for a blob column), an `ArrayBuffer`, or a plain
 * number array (JSON round-trip). Returns null when absent or when the byte
 * length is not a whole number of Int32 words.
 */
export function decodePermutation(blob: unknown): Int32Array | null {
  if (blob == null) return null
  if (blob instanceof Uint8Array) {
    if (blob.byteLength === 0 || blob.byteLength % 4 !== 0) return null
    // slice() copies into a buffer of exactly byteLength, so the Int32 view is
    // 4-byte aligned regardless of the source view's offset.
    return new Int32Array(blob.slice().buffer)
  }
  if (blob instanceof ArrayBuffer) {
    if (blob.byteLength === 0 || blob.byteLength % 4 !== 0) return null
    return new Int32Array(blob)
  }
  if (Array.isArray(blob)) return Int32Array.from(blob as number[])
  return null
}

/**
 * Indices of `randomTrackIds` within `trackIds`, consuming duplicate
 * positions in order so a queue holding the same track twice keeps both of
 * its slots.
 *
 * The result is ALWAYS a complete permutation of `[0, trackIds.length)`:
 * ids absent from the ordered list are dropped, and the ordered slots the
 * random list did not mention are appended. Downstream length invariants
 * (the wrap position, position-to-index mapping) depend on that.
 */
export function permutationOf(
  trackIds: readonly string[],
  randomTrackIds: readonly string[],
): number[] {
  const slots = new Map<string, number[]>()
  for (let i = 0; i < trackIds.length; i++) {
    const id = trackIds[i]!
    const existing = slots.get(id)
    if (existing) existing.push(i)
    else slots.set(id, [i])
  }

  const cursors = new Map<string, number>()
  const used = new Uint8Array(trackIds.length)
  const out: number[] = []
  for (const id of randomTrackIds) {
    const positions = slots.get(id)
    if (!positions) continue
    const cursor = cursors.get(id) ?? 0
    if (cursor >= positions.length) continue
    const position = positions[cursor]!
    out.push(position)
    used[position] = 1
    cursors.set(id, cursor + 1)
  }

  for (let i = 0; i < trackIds.length; i++) {
    if (used[i] === 0) out.push(i)
  }
  return out
}

/**
 * The permutation that resolves active-list positions for a queue with the
 * given shuffle flag. `null` means the active list IS the ordered list:
 * either shuffle is off, or no permutation is stored.
 *
 * Every consumer that resolves an active position goes through this, so the
 * UI, the materializer's `currentTrackId`, and the step actions cannot
 * disagree about which track a position points at.
 */
export function activeOrderPermutation(
  shuffle: boolean | null | undefined,
  randomOrder: unknown,
): Int32Array | null {
  if (!shuffle) return null
  return decodePermutation(randomOrder)
}

/**
 * Map a position in the active (shuffle) list to its ordered-list index.
 * Identity when there is no permutation or the position falls outside it.
 */
export function activeIndexToOrderedIndex(perm: Int32Array | null, position: number): number {
  if (!perm || position < 0 || position >= perm.length) return position
  return perm[position]!
}

/**
 * Map an ordered-list index to its position in the active (shuffle) list.
 * O(n) in the shuffled length; used only when jumping to a known track.
 */
export function orderedIndexToActiveIndex(perm: Int32Array | null, orderedIndex: number): number {
  if (!perm) return orderedIndex
  const position = perm.indexOf(orderedIndex)
  return position === -1 ? orderedIndex : position
}

/** Rebuild the shuffled track-id list from the ordered list + permutation. */
export function permutationToTrackIds(
  trackIds: readonly string[],
  perm: Int32Array | null,
): string[] {
  if (!perm) return []
  const out: string[] = []
  for (let i = 0; i < perm.length; i++) {
    const id = trackIds[perm[i]!]
    if (id !== undefined) out.push(id)
  }
  return out
}
