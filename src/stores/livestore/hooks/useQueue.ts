import { useQuery } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { tables } from '../schema'

/**
 * Queue Query Hooks
 * 
 * These hooks provide reactive access to playback queue data from LiveStore.
 * They automatically update when the underlying data changes.
 */

/**
 * Get the current queue state
 * 
 * Note: There should typically be only one queue with id 'default'
 * 
 * @example
 * ```tsx
 * const queue = useQueue()
 * if (!queue) return <div>No queue</div>
 * return <div>{queue.trackIds.length} tracks in queue</div>
 * ```
 */
export const useQueue = (queueId = 'default') => {
  const result = useQuery(
    queryDb(
      tables.queue
        .select()
        .where('id', '=', queueId)
        .limit(1)
    )
  )
  return (result as any[])[0] || null
}

/**
 * Get tracks in the current queue with full media information
 * 
 * @example
 * ```tsx
 * const tracks = useQueueTracks()
 * return <div>{tracks.length} tracks</div>
 * ```
 */
export const useQueueTracks = (queueId = 'default') => {
  const queue = useQueue(queueId)
  
  if (!queue || !queue.trackIds || (queue.trackIds as any[]).length === 0) {
    return []
  }
  
  // Parse trackIds (it's a JSON array)
  const trackIds = typeof queue.trackIds === 'string'
    ? JSON.parse(queue.trackIds)
    : queue.trackIds
  
  // Get media items by their IDs
  const media = useQuery(
    queryDb(
      tables.media
        .select()
        .where('id', 'IN', trackIds)
    )
  )
  
  // Sort media by queue order
  const mediaMap = new Map((media as any[]).map(m => [m.id, m]))
  return trackIds
    .map((id: string) => mediaMap.get(id))
    .filter((m: any) => m !== undefined)
}

/**
 * Get the currently playing track from the queue
 * 
 * @example
 * ```tsx
 * const currentTrack = useCurrentTrack()
 * if (!currentTrack) return <div>Nothing playing</div>
 * return <div>Now playing: {currentTrack.title}</div>
 * ```
 */
export const useCurrentTrack = (queueId = 'default') => {
  const queue = useQueue(queueId)
  
  if (!queue || queue.currentPlaying === null || queue.currentPlaying === undefined) {
    return null
  }
  
  // Parse trackIds
  const trackIds = typeof queue.trackIds === 'string'
    ? JSON.parse(queue.trackIds)
    : queue.trackIds
  
  const currentTrackId = trackIds[queue.currentPlaying]
  
  if (!currentTrackId) {
    return null
  }
  
  // Get the current track
  const result = useQuery(
    queryDb(
      tables.media
        .select()
        .where('id', '=', currentTrackId)
        .limit(1)
    )
  )
  
  return (result as any[])[0] || null
}

/**
 * Get the ID of the currently playing song
 * Converts queue.currentPlaying (index) to actual song ID
 * 
 * @example
 * ```tsx
 * const currentSongId = useCurrentPlayingSongId()
 * if (!currentSongId) return <div>Nothing playing</div>
 * ```
 */
export const useCurrentPlayingSongId = (queueId = 'default'): string | null => {
  const queue = useQueue(queueId)
  
  if (!queue || queue.currentPlaying === null || queue.currentPlaying === undefined) {
    return null
  }
  
  // Parse trackIds (it's stored as JSON in SQLite)
  const trackIds = typeof queue.trackIds === 'string'
    ? JSON.parse(queue.trackIds)
    : queue.trackIds
  
  return trackIds[queue.currentPlaying] || null
}

/**
 * Get the next/previous song IDs based on queue state
 * 
 * @example
 * ```tsx
 * const { nextSongId, prevSongId } = useQueueNavigation()
 * ```
 */
export const useQueueNavigation = (queueId = 'default') => {
  const queue = useQueue(queueId)
  
  if (!queue || queue.currentPlaying === null || queue.currentPlaying === undefined) {
    return { nextSongId: null, prevSongId: null }
  }
  
  const trackIds = typeof queue.trackIds === 'string'
    ? JSON.parse(queue.trackIds)
    : queue.trackIds
  
  const currentIndex = queue.currentPlaying
  
  // Determine which track list to use
  const activeTrackIds = queue.shuffle 
    ? (typeof queue.randomTrackIds === 'string' 
        ? JSON.parse(queue.randomTrackIds) 
        : queue.randomTrackIds)
    : trackIds
  
  // Calculate next/prev
  const nextIndex = currentIndex + 1
  const prevIndex = currentIndex - 1
  
  let nextSongId = null
  let prevSongId = null
  
  // Next song
  if (nextIndex < activeTrackIds.length) {
    nextSongId = activeTrackIds[nextIndex]
  } else if (queue.repeat && activeTrackIds.length > 0) {
    nextSongId = activeTrackIds[0] // Loop back to start
  }
  
  // Previous song
  if (prevIndex >= 0) {
    prevSongId = activeTrackIds[prevIndex]
  } else if (queue.repeat && activeTrackIds.length > 0) {
    prevSongId = activeTrackIds[activeTrackIds.length - 1] // Loop to end
  }
  
  return { nextSongId, prevSongId }
}
