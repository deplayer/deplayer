import { useAppStore } from '../store'
import { queryDb } from '@livestore/livestore'
import { tables } from '../schema'
import { resolveQueueNavigation } from './queueUtils'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useQueue = (queueId = 'default'): QueueRecord | null => {
  const store = useAppStore()
  const result = store.useQuery(
    queryDb(
      tables.queue
        .select()
        .where('id', '=', queueId)
        .limit(1)
    )
  )
  return (result as unknown as QueueRecord[])[0] || null
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
  return trackIds.flatMap((id: string) => {
      const m = mediaMap.get(id)
      return m ? [m] : []
    })
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
  // Read the authoritative currentTrackId column to stay aligned with
  // useCurrentPlayingSongId — avoids split-brain between derived and stored value.
  const currentTrackId = useCurrentPlayingSongId(queueId)

  const result = store.useQuery(
    queryDb(
      tables.media
        .select()
        .where('id', '=', currentTrackId ?? '__NONE__')
        .limit(1)
    )
  )

  if (!currentTrackId) return null
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
  const store = useAppStore()
  const result = store.useQuery(
    queryDb(
      tables.queue
        .select('currentTrackId')
        .where('id', '=', queueId)
        .limit(1)
    )
  )
  const row = (result as unknown as Array<{ currentTrackId: string | null }>)?.[0]
  return row?.currentTrackId ?? null
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
