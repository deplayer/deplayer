/**
 * Queue module types.
 *
 * `QueueState` is the normalized, raw-row-tolerant shape shared by the
 * resolution functions, transitions, and the async actions. `QueueRecord`
 * is the raw LiveStore row shape returned by the query hooks.
 */

export interface QueueState {
  trackIds: readonly string[] | string
  randomTrackIds?: readonly string[] | string
  currentPlaying: number | null | undefined
  currentTrackId?: string | null
  shuffle?: boolean
  repeat?: boolean
}

export interface QueueRecord {
  id: string;
  trackIds: string | string[];
  randomTrackIds: string | string[];
  currentPlaying: number | null;
  shuffle: boolean;
  repeat: boolean;
  nextSongId: string | null;
  prevSongId: string | null;
  [key: string]: unknown;
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

export type QueueClearedEvent = {
  queueId: string
}

export type QueueTransitionEvent =
  | QueueUpdatedEvent
  | QueuePositionChangedEvent
  | QueueRepeatToggledEvent
  | QueueClearedEvent
