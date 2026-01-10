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
