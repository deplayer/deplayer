import { events } from '../schema'

/**
 * LiveStore Queue Actions
 * 
 * These actions handle playback queue operations.
 * Side effects (audio playback, notifications) remain in Redux saga.
 * 
 * All actions require a store parameter from useStore() hook.
 */

type LiveStore = {
  commit: (event: any) => void
  query: (query: any) => Promise<any>
  [key: string]: any
}

const QUEUE_ID = 'default'

/**
 * Get current queue from LiveStore
 */
const getCurrentQueue = async (store: LiveStore) => {
  const result = await store.query({
    query: `SELECT * FROM queue WHERE id = ?`,
    bindValues: [QUEUE_ID]
  })
  
  const rows = (result as any)?.[0]?.values || []
  
  if (rows.length === 0) {
    return null
  }
  
  return {
    id: rows[0][0],
    trackIds: JSON.parse(rows[0][1] || '[]'),
    randomTrackIds: JSON.parse(rows[0][2] || '[]'),
    currentPlaying: rows[0][3],
    shuffle: Boolean(rows[0][4]),
    repeat: Boolean(rows[0][5]),
    updatedAt: rows[0][6],
  }
}

/**
 * Play all - Replace queue with new tracks and start playing
 * 
 * @param store - LiveStore instance
 * @param trackIds - Array of media IDs to play
 * @returns First track ID for saga to trigger playback
 */
export const playAllAction = async (store: LiveStore, trackIds: string[]) => {
  if (!trackIds || trackIds.length === 0) {
    console.warn('playAllAction: No tracks provided')
    return null
  }

  // Replace entire queue
  store.commit(
    events.queueUpdated({
      id: QUEUE_ID,
      trackIds,
      currentPlaying: 0, // Start at first track
      shuffle: false,
      repeat: false,
    })
  )

  // Return first track ID for saga to start playback
  return trackIds[0]
}

/**
 * Add tracks to end of queue
 * 
 * @param store - LiveStore instance
 * @param trackIds - Array of media IDs to add
 */
export const addToQueueAction = async (store: LiveStore, trackIds: string[]) => {
  if (!trackIds || trackIds.length === 0) {
    return
  }

  const currentQueue = await getCurrentQueue(store)
  
  if (!currentQueue) {
    // No queue exists, create one
    store.commit(
      events.queueUpdated({
        id: QUEUE_ID,
        trackIds,
        currentPlaying: undefined,
        shuffle: false,
        repeat: false,
      })
    )
    return
  }

  // Append to existing queue
  const newTrackIds = [...currentQueue.trackIds, ...trackIds]
  
  store.commit(
    events.queueUpdated({
      id: QUEUE_ID,
      trackIds: newTrackIds,
      currentPlaying: currentQueue.currentPlaying,
      shuffle: currentQueue.shuffle,
      repeat: currentQueue.repeat,
    })
  )
}

/**
 * Add tracks to queue after currently playing track (Play Next)
 * 
 * @param store - LiveStore instance
 * @param trackIds - Array of media IDs to add next
 * @returns First track ID for saga to potentially start playback
 */
export const addNextAction = async (store: LiveStore, trackIds: string[]) => {
  if (!trackIds || trackIds.length === 0) {
    return null
  }

  const currentQueue = await getCurrentQueue(store)
  
  if (!currentQueue) {
    // No queue exists, create one and start playing
    store.commit(
      events.queueUpdated({
        id: QUEUE_ID,
        trackIds,
        currentPlaying: 0,
        shuffle: false,
        repeat: false,
      })
    )
    return trackIds[0]
  }

  // Insert after current playing position
  const insertPosition = currentQueue.currentPlaying !== null 
    ? currentQueue.currentPlaying + 1 
    : 0
  
  const newTrackIds = [
    ...currentQueue.trackIds.slice(0, insertPosition),
    ...trackIds,
    ...currentQueue.trackIds.slice(insertPosition),
  ]
  
  store.commit(
    events.queueUpdated({
      id: QUEUE_ID,
      trackIds: newTrackIds,
      currentPlaying: currentQueue.currentPlaying,
      shuffle: currentQueue.shuffle,
      repeat: currentQueue.repeat,
    })
  )

  return null
}

/**
 * Remove a track from the queue
 * 
 * @param store - LiveStore instance
 * @param trackId - Media ID to remove
 */
export const removeFromQueueAction = async (store: LiveStore, trackId: string) => {
  const currentQueue = await getCurrentQueue(store)
  
  if (!currentQueue) {
    return
  }

  // Remove all occurrences of the track
  const newTrackIds = currentQueue.trackIds.filter((id: string) => id !== trackId)
  
  // Adjust currentPlaying if needed
  let newCurrentPlaying = currentQueue.currentPlaying
  
  if (newCurrentPlaying !== null && newCurrentPlaying >= newTrackIds.length) {
    newCurrentPlaying = newTrackIds.length > 0 ? newTrackIds.length - 1 : null
  }
  
  store.commit(
    events.queueUpdated({
      id: QUEUE_ID,
      trackIds: newTrackIds,
      currentPlaying: newCurrentPlaying,
      shuffle: currentQueue.shuffle,
      repeat: currentQueue.repeat,
    })
  )
}

/**
 * Clear the entire queue
 * 
 * @param store - LiveStore instance
 */
export const clearQueueAction = async (store: LiveStore) => {
  store.commit(
    events.queueCleared({
      queueId: QUEUE_ID,
    })
  )
}

/**
 * Toggle shuffle mode
 * 
 * @param store - LiveStore instance
 * @param shuffle - New shuffle state
 */
export const toggleShuffleAction = async (store: LiveStore, shuffle: boolean) => {
  store.commit(
    events.queueShuffleToggled({
      queueId: QUEUE_ID,
      shuffle,
    })
  )
}

/**
 * Toggle repeat mode
 * 
 * @param store - LiveStore instance
 * @param repeat - New repeat state
 */
export const toggleRepeatAction = async (store: LiveStore, repeat: boolean) => {
  store.commit(
    events.queueRepeatToggled({
      queueId: QUEUE_ID,
      repeat,
    })
  )
}

/**
 * Set currently playing position
 * 
 * @param store - LiveStore instance
 * @param position - Index in queue to play
 */
export const setCurrentPlayingAction = async (store: LiveStore, position: number) => {
  store.commit(
    events.queuePositionChanged({
      queueId: QUEUE_ID,
      position,
    })
  )
}
