/**
 * Queue module — single deep module for the playback queue.
 *
 * Everything the app needs to know about the queue lives behind this one
 * interface:
 *
 * - **Read**: `useQueue` (reactive, normalized `QueueState`), `readQueue`
 *   (async, normalized), `useCurrentPlayingSongId`,
 *   `resolveCurrentPlayingSongId` (non-reactive).
 * - **Mutate**: the async actions (`playAllAction`, `addToQueueAction`,
 *   `addNextAction`, `removeFromQueueAction`, `clearQueueAction`,
 *   `toggleShuffleAction`, `toggleRepeatAction`, `setCurrentPlayingAction`,
 *   `playNextAction`, `playPreviousAction`, `playMediaAction`).
 * - **Pure rules**: `parseIds`, `getActiveTrackIds`, `resolveCurrentSongId`,
 *   `deriveCurrentTrackId`, `fisherYates`, and the
 *   transition functions — the read/write domain logic the above are built
 *   from. Testable with no LiveStore and no React.
 *
 */

export type {
  QueueState,
  QueueUpdatedEvent,
  QueuePositionChangedEvent,
  QueueRepeatToggledEvent,
  QueueClearedEvent,
  QueueTransitionEvent,
} from './types'

export {
  parseIds,
  getActiveTrackIds,
  resolveCurrentSongId,
  deriveCurrentTrackId,
  fisherYates,
} from './resolution'

export {
  playAll,
  addToQueue,
  addNext,
  removeFromQueue,
  clearQueue,
  toggleShuffle,
  toggleRepeat,
  setCurrentPlaying,
} from './transitions'

export { readQueue, resolveCurrentPlayingSongId } from './storeReaders'

export {
  playAllAction,
  addToQueueAction,
  addNextAction,
  removeFromQueueAction,
  clearQueueAction,
  toggleShuffleAction,
  toggleRepeatAction,
  setCurrentPlayingAction,
  playNextAction,
  playPreviousAction,
  playMediaAction,
} from './actions'

export {
  useQueue,
  useCurrentPlayingSongId,
} from './hooks'
