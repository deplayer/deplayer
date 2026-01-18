import { events } from '../schema'
import { queueEvents } from '../events/queue'

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
    bindValues: { 1: QUEUE_ID }
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
  await store.commit(
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
  
  await store.commit(
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
    await store.commit(
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
  
  await store.commit(
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
  
  await store.commit(
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
  await store.commit(
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
  await store.commit(
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
  await store.commit(
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
  await store.commit(
    events.queuePositionChanged({
      queueId: QUEUE_ID,
      position,
    })
  )
}

/**
 * Play next song in queue
 * Increments currentPlaying index or loops if repeat is on
 * 
 * @param store - LiveStore instance
 * @param queueId - Queue ID (default: 'default')
 */
export async function playNextAction(
  store: LiveStore,
  queueId = QUEUE_ID
): Promise<void> {
  const queue = await getCurrentQueue(store)
  
  if (!queue) {
    throw new Error(`Queue ${queueId} not found`)
  }
  
  const trackIds = queue.shuffle ? queue.randomTrackIds : queue.trackIds
  const currentIndex = queue.currentPlaying ?? -1
  const nextIndex = currentIndex + 1
  
  // Determine next position
  let newPosition: number | undefined
  
  if (nextIndex < trackIds.length) {
    newPosition = nextIndex
  } else if (queue.repeat && trackIds.length > 0) {
    newPosition = 0 // Loop back to start
  } else {
    // End of queue, no repeat
    newPosition = undefined
  }
  
  if (newPosition !== undefined) {
    await store.commit(queueEvents.queuePositionChanged({
      queueId,
      position: newPosition,
    }))
  }
}

/**
 * Play previous song in queue
 * Decrements currentPlaying index or loops if repeat is on
 * 
 * @param store - LiveStore instance
 * @param queueId - Queue ID (default: 'default')
 */
export async function playPreviousAction(
  store: LiveStore,
  queueId = QUEUE_ID
): Promise<void> {
  const queue = await getCurrentQueue(store)
  
  if (!queue) {
    throw new Error(`Queue ${queueId} not found`)
  }
  
  const trackIds = queue.shuffle ? queue.randomTrackIds : queue.trackIds
  const currentIndex = queue.currentPlaying ?? 0
  const prevIndex = currentIndex - 1
  
  // Determine previous position
  let newPosition: number
  
  if (prevIndex >= 0) {
    newPosition = prevIndex
  } else if (queue.repeat && trackIds.length > 0) {
    newPosition = trackIds.length - 1 // Loop to end
  } else {
    // Start of queue, no repeat
    newPosition = 0
  }
  
  await store.commit(queueEvents.queuePositionChanged({
    queueId,
    position: newPosition,
  }))
}

/**
 * Play a specific song by ID
 * Finds the song in the queue and sets currentPlaying to its index
 * 
 * @param store - LiveStore instance
 * @param mediaId - Song ID to play
 * @param queueId - Queue ID (default: 'default')
 */
export async function playMediaAction(
  store: LiveStore,
  mediaId: string,
  queueId = QUEUE_ID
): Promise<void> {
  const queue = await getCurrentQueue(store)
  
  if (!queue) {
    throw new Error(`Queue ${queueId} not found`)
  }
  
  const trackIds = queue.trackIds
  const index = trackIds.indexOf(mediaId)
  
  if (index === -1) {
    throw new Error(`Media ${mediaId} not found in queue`)
  }
  
  await store.commit(queueEvents.queuePositionChanged({
    queueId,
    position: index,
  }))
}
