/**
 * Pure queue stepping rules for the normalized queue_items storage.
 *
 * The async step actions (playNextAction / playPreviousAction /
 * playMediaAction) fetch only the queue head row and the one or two
 * neighboring queue_items rows they need, then hand them to these
 * functions. The rules mirror the full-list transitions in
 * `./transitions.ts` (which stay the source of truth for the list-mutating
 * actions) and are pure: no LiveStore, no schema, testable without
 * infrastructure.
 */

import type { QueuePositionChangedEvent, QueueHeadRow, QueueItemRow } from './types'

/** The list `currentPlaying` indexes into. */
export const activeListName = (shuffle: boolean | null | undefined): 'ordered' | 'random' =>
  shuffle ? 'random' : 'ordered'

const args = (position: number, trackId?: string): QueuePositionChangedEvent =>
  ({ queueId: 'default', position, trackId })

/**
 * Advance one step.
 *
 * - `atNext` is the row at the position after the current one (when it
 *   exists); its own `position` is used for the commit.
 * - `atZero` is the row at position 0 (repeat wrap).
 *
 * No row at position 0 means the active list is empty: stop (matches
 * `transitions.playNext`, which requires a non-empty active list to wrap).
 */
export function stepNext(
  head: QueueHeadRow,
  atNext: QueueItemRow | null,
  atZero: QueueItemRow | null,
): QueuePositionChangedEvent | null {
  if (atNext) return args(atNext.position, atNext.trackId)
  if (head.repeat && atZero) return args(0, atZero.trackId)
  return null
}

/**
 * Go back one step. Always commits when the head exists (even the
 * stay-put case at position 0 with repeat off).
 *
 * - `atPrev` is the row at the position before the current one (when it
 *   exists); its own `position` is used for the commit.
 * - `last` is the highest-position row (repeat wrap).
 *
 * Edge: empty active list (no row at position 0, no last row) → position 0
 * with an undefined trackId (matches `transitions.playPrevious`, whose
 * `active[0]` is undefined; locked in by the actions spec).
 */
export function stepPrevious(
  head: QueueHeadRow,
  atPrev: QueueItemRow | null,
  last: QueueItemRow | null,
): QueuePositionChangedEvent {
  if (atPrev) return args(atPrev.position, atPrev.trackId)
  if (head.repeat && last) return args(last.position, last.trackId)
  return args(0)
}

/**
 * Jump to a track in the active list.
 *
 * - `found` is the row for `mediaId` in the active list (when found).
 *
 * Not found → null (the action warns, matching `transitions.playMedia`).
 */
export function stepToMedia(
  found: QueueItemRow | null,
): QueuePositionChangedEvent | null {
  if (!found) return null
  return args(found.position, found.trackId)
}
