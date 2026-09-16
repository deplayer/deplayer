/**
 * Queue module — single deep module for the playback queue.
 *
 * Everything the app needs to know about the queue lives behind this one
 * interface:
 *
 * - **Read**: `useQueue` (reactive, normalized `QueueState`), `readQueue`
 *   (async, normalized), `useCurrentTrack`, `useCurrentPlayingSongId`,
 *   `useQueueNavigation`, `resolveCurrentPlayingSongId` (non-reactive).
 * - **Mutate**: the async actions (`playAllAction`, `addToQueueAction`,
 *   `addNextAction`, `removeFromQueueAction`, `clearQueueAction`,
 *   `toggleShuffleAction`, `toggleRepeatAction`, `setCurrentPlayingAction`,
 *   `playNextAction`, `playPreviousAction`, `playMediaAction`).
 * - **Pure rules**: `parseIds`, `getActiveTrackIds`, `resolveCurrentSongId`,
 *   `resolveQueueNavigation`, `deriveCurrentTrackId`, `fisherYates`, and the
 *   transition functions — the read/write domain logic the above are built
 *   from. Testable with no LiveStore and no React.
 *
 * The raw LiveStore row shape (`QueueRecord`) is an implementation detail:
 * the only public shapes are `QueueState` (normalized) and the event payload
 * types (which mirror `events/queue.ts`).
 */

export type {
  QueueState,
  QueueRecord,
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
  resolveQueueNavigation,
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
  playNext,
  playPrevious,
  playMedia,
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
  useCurrentTrack,
  useCurrentPlayingSongId,
  useQueueNavigation,
} from './hooks'
