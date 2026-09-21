/**
 * Queue module types.
 *
 * `QueueState` is the normalized, raw-row-tolerant shape shared by the
 * resolution functions, transitions, and the async actions. `QueueHeadRow`
 * is the raw head row of the `queue` table (playback state only — the
 * track lists live in `queue_items`), and `QueueItemRow` is one row of
 * `queue_items`.
 */

export interface QueueState {
  trackIds: readonly string[] | string
  randomTrackIds?: readonly string[] | string
  currentPlaying: number | null | undefined
  currentTrackId?: string | null
  shuffle?: boolean
  repeat?: boolean
}

/** Raw `queue` table row (playback head only). */
export interface QueueHeadRow {
  id: string;
  currentPlaying: number | null;
  currentTrackId: string | null;
  shuffle: boolean;
  repeat: boolean;
  /** Shuffle order: indices into the ordered list, as an Int32 LE blob. */
  randomOrder: PermutationBlob | null;
  updatedAt: number | null;
  [key: string]: unknown;
}

/**
 * The stored shuffle permutation: an Int32 LE blob of ordered indices.
 * SQLite hands blob columns back as an `ArrayBuffer`-backed view.
 */
export type PermutationBlob = Uint8Array<ArrayBuffer>

/**
 * The single list materialized as `queue_items` rows. The shuffle order is
 * the head row's `randomOrder` permutation, not a second list.
 */
export const ORDERED_LIST = 'ordered'

/** Raw `queue_items` table row: one track at one position in the ordered list. */
export interface QueueItemRow {
  id: string;
  queueId: string;
  list: typeof ORDERED_LIST;
  position: number;
  trackId: string;
}

/**
 * A track at a position in the *active* (shuffle-aware) list. Steps commit
 * `position` directly, so it is the active position, not the ordered index.
 */
export interface ActiveRow {
  position: number
  trackId: string
}

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

/**
 * Toggle shuffle without rewriting the track lists: the head row alone
 * changes. `randomOrder` is a permutation of ordered-list indices (empty when
 * disabling).
 */
export type QueueShuffleToggledEvent = {
  queueId: string
  shuffle: boolean
  currentPlaying?: number
  randomOrder?: readonly number[]
}

export type QueueClearedEvent = {
  queueId: string
}

export type QueueTransitionEvent =
  | QueueUpdatedEvent
  | QueuePositionChangedEvent
  | QueueRepeatToggledEvent
  | QueueShuffleToggledEvent
  | QueueClearedEvent
