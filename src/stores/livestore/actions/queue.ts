import { queryDb } from '@livestore/livestore'
import { events, tables } from '../schema'
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
 * Uses queryDb for consistency with hooks
 */
const getCurrentQueue = async (store: LiveStore) => {
  try {
    const query = queryDb(
      tables.queue
        .select()
        .where('id', '=', QUEUE_ID)
        .limit(1)
    )
    
    const result = await store.query(query)
    
    // queryDb returns array of objects directly
    const row = Array.isArray(result) ? result[0] : null
    
    if (!row) {
      return null
    }
    
    // Parse JSON fields if they're strings
    const parseJson = (val: any, defaultVal: string[] = []): string[] => {
      if (!val) return defaultVal
      if (Array.isArray(val)) return val as string[]
      try {
        return JSON.parse(val) as string[]
      } catch {
        return defaultVal
      }
    }
    
    return {
      id: row.id as string,
      trackIds: parseJson(row.trackIds),
      randomTrackIds: parseJson(row.randomTrackIds),
      currentPlaying: row.currentPlaying,
      shuffle: Boolean(row.shuffle),
      repeat: Boolean(row.repeat),
      updatedAt: row.updatedAt,
    }
  } catch (error) {
    console.error('[getCurrentQueue] Error:', error)
    return null
  }
}

/**
 * Replace queue with new tracks, positioned at the first track.
 * 
 * @param store - LiveStore instance
 * @param trackIds - Array of media IDs to play
 */
export const playAllAction = async (store: LiveStore, trackIds: string[]): Promise<void> => {
  if (!trackIds || trackIds.length === 0) {
    console.warn('playAllAction: No tracks provided')
    return
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
 * Shuffle an array using Fisher-Yates algorithm
 */
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Toggle shuffle mode (Spotify-style)
 * 
 * - Current song keeps playing uninterrupted
 * - Only affects next/previous navigation order
 * - currentPlaying index updates to point to same song in new array
 * 
 * @param store - LiveStore instance
 * @param shuffle - New shuffle state
 */
export const toggleShuffleAction = async (store: LiveStore, shuffle: boolean) => {
  const currentQueue = await getCurrentQueue(store)
  
  if (!currentQueue || currentQueue.trackIds.length === 0) {
    // No queue exists or queue is empty - nothing to shuffle
    console.warn('[toggleShuffleAction] No queue or empty queue, cannot toggle shuffle')
    return
  }

  if (shuffle) {
    // ENABLE SHUFFLE
    // Generate randomized track order
    const randomTrackIds = shuffleArray(currentQueue.trackIds)
    
    // Find current song's position in the NEW shuffled array
    // This keeps the same song playing, just changes what "next" means
    let newCurrentPlaying = currentQueue.currentPlaying
    if (currentQueue.currentPlaying !== null && currentQueue.currentPlaying !== undefined) {
      const currentTrackId = currentQueue.trackIds[currentQueue.currentPlaying]
      const indexInShuffled = randomTrackIds.indexOf(currentTrackId)
      if (indexInShuffled !== -1) {
        newCurrentPlaying = indexInShuffled
      }
    }

    // Atomic update - all fields at once
    await store.commit(
      events.queueUpdated({
        id: QUEUE_ID,
        trackIds: currentQueue.trackIds,
        randomTrackIds,
        currentPlaying: newCurrentPlaying,
        shuffle: true,
        repeat: currentQueue.repeat,
      })
    )
  } else {
    // DISABLE SHUFFLE
    // Find current song's position in the ORIGINAL track order
    let newCurrentPlaying = currentQueue.currentPlaying
    if (currentQueue.currentPlaying !== null && currentQueue.currentPlaying !== undefined && currentQueue.randomTrackIds.length > 0) {
      const currentTrackId = currentQueue.randomTrackIds[currentQueue.currentPlaying]
      const indexInOriginal = currentQueue.trackIds.indexOf(currentTrackId)
      if (indexInOriginal !== -1) {
        newCurrentPlaying = indexInOriginal
      }
    }

    // Atomic update - all fields at once
    await store.commit(
      events.queueUpdated({
        id: QUEUE_ID,
        trackIds: currentQueue.trackIds,
        randomTrackIds: [],
        currentPlaying: newCurrentPlaying,
        shuffle: false,
        repeat: currentQueue.repeat,
      })
    )
  }
}

/**
 * Toggle repeat mode
 * 
 * @param store - LiveStore instance
 * @param repeat - New repeat state
 */
export const toggleRepeatAction = async (store: LiveStore, repeat: boolean) => {
  const currentQueue = await getCurrentQueue(store)
  
  if (!currentQueue) {
    console.warn('[toggleRepeatAction] No queue exists, cannot toggle repeat')
    return
  }
  
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
    console.warn(`[playNextAction] Queue ${queueId} not found`)
    return
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
    console.warn(`[playPreviousAction] Queue ${queueId} not found`)
    return
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
    console.warn(`[playMediaAction] Queue ${queueId} not found`)
    return
  }
  
  // Use the active track list based on shuffle state
  const trackIds = queue.shuffle ? queue.randomTrackIds : queue.trackIds
  const index = trackIds.indexOf(mediaId)
  
  if (index === -1) {
    console.warn(`[playMediaAction] Media ${mediaId} not found in queue`)
    return
  }
  
  await store.commit(queueEvents.queuePositionChanged({
    queueId,
    position: index,
  }))
}
