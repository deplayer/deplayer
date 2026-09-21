/**
 * Pure queue stepping rules for the normalized queue storage.
 *
 * The async step actions (playNextAction / playPreviousAction /
 * playMediaAction) fetch only the queue head row and the one or two ordered
 * `queue_items` rows they need, resolve the shuffle permutation in the head
 * row, and hand the resulting active-list rows to these functions. The rules
 * mirror the full-list transitions in `./transitions.ts` and are pure: no
 * LiveStore, no schema, testable without infrastructure.
 */

import type { QueuePositionChangedEvent, QueueHeadRow, ActiveRow } from './types'

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
  atNext: ActiveRow | null,
  atZero: ActiveRow | null,
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
  atPrev: ActiveRow | null,
  last: ActiveRow | null,
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
  found: ActiveRow | null,
): QueuePositionChangedEvent | null {
  if (!found) return null
  return args(found.position, found.trackId)
}
