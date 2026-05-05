import { useAppStore } from '../store'
import { queryDb } from '@livestore/livestore'
import { tables } from '../schema'
import { resolveCurrentSongId, resolveQueueNavigation } from './queueUtils'

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useQueue = (queueId = 'default'): any => {
  const store = useAppStore()
  const result = store.useQuery(
    queryDb(
      tables.queue
        .select()
        .where('id', '=', queueId)
        .limit(1)
    )
  )
  return (result as unknown as Record<string, unknown>[])[0] || null
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
  const store = useAppStore()
  const queue = useQueue(queueId)
  
  if (!queue || !queue.trackIds || (queue.trackIds as string[]).length === 0) {
    return []
  }

  // Parse trackIds (it's a JSON array)
  const trackIds = typeof queue.trackIds === 'string'
    ? JSON.parse(queue.trackIds)
    : queue.trackIds

  // Get media items by their IDs
  const media = store.useQuery(
    queryDb(
      tables.media
        .select()
        .where('id', 'IN', trackIds)
    )
  )

  // Sort media by queue order
  const mediaMap = new Map((media as unknown as Array<{ id: string }>).map(m => [m.id, m]))
  return trackIds
    .map((id: string) => mediaMap.get(id))
    .filter((m: unknown) => m !== undefined)
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
  const store = useAppStore()
  const queue = useQueue(queueId)
  
  const currentTrackId = resolveCurrentSongId(queue)
  
  if (!currentTrackId) {
    return null
  }
  
  // Get the current track
  const result = store.useQuery(
    queryDb(
      tables.media
        .select()
        .where('id', '=', currentTrackId)
        .limit(1)
    )
  )
  
  return (result as unknown as Record<string, unknown>[])[0] || null
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
  
  return resolveCurrentSongId(queue)
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
  
  return resolveQueueNavigation(queue)
}
