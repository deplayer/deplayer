import { Store as LiveStore } from '@livestore/livestore'
import { 
  playAllAction, 
  addNextAction, 
  playMediaAction 
} from '../stores/livestore/actions/queue'

/**
 * Get current queue from LiveStore
 * (Helper to avoid code duplication)
 */
const getCurrentQueue = async (store: LiveStore) => {
  const result = await store.query({
    query: `SELECT * FROM queue WHERE id = ?`,
    bindValues: { 1: 'default' }
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
 * Ensures media is in queue and sets it as currently playing
 * 
 * Strategy (Option C):
 * - If no queue exists and allMediaIds provided: populate queue with all visible songs
 * - If no queue exists and no allMediaIds: create queue with just this song
 * - If queue exists and song is in queue: just set position to that song
 * - If queue exists and song not in queue: add song next and play it
 * 
 * @param liveStore - LiveStore instance from useStore()
 * @param mediaId - ID of media to play
 * @param allMediaIds - Optional: all media IDs visible in current view
 * @returns Promise<void>
 * @throws Error if LiveStore operations fail
 */
export async function ensureMediaInQueueAndPlay(
  liveStore: LiveStore | null,
  mediaId: string,
  allMediaIds?: string[]
): Promise<void> {
  if (!liveStore) {
    throw new Error('LiveStore not available')
  }
  
  if (!mediaId) {
    throw new Error('Media ID is required')
  }
  
  // Get current queue state
  const queue = await getCurrentQueue(liveStore)
  
  if (!queue || queue.trackIds.length === 0) {
    // CASE 1: No queue exists
    if (allMediaIds && allMediaIds.length > 0) {
      // Option C: Populate with all visible songs for better UX
      console.log('[QueueHelper] Creating queue with', allMediaIds.length, 'songs')
      await playAllAction(liveStore, allMediaIds)
      
      // Ensure LiveStore has materialized the queue before querying
      liveStore.manualRefresh?.()
      
      // Set position to clicked song
      const index = allMediaIds.indexOf(mediaId)
      if (index > 0) {
        // If not first song, update position
        await playMediaAction(liveStore, mediaId)
      }
      // If index is 0, playAllAction already set it as current
    } else {
      // Just play this one song
      console.log('[QueueHelper] Creating queue with single song:', mediaId)
      await playAllAction(liveStore, [mediaId])
    }
  } else {
    // CASE 2: Queue exists
    const index = queue.trackIds.indexOf(mediaId)
    
    if (index !== -1) {
      // Song already in queue - just set position
      console.log('[QueueHelper] Song in queue at position', index)
      await playMediaAction(liveStore, mediaId)
    } else {
      // Song not in queue - add it next and play it
      console.log('[QueueHelper] Adding song to queue and playing:', mediaId)
      await addNextAction(liveStore, [mediaId])
      await playMediaAction(liveStore, mediaId)
    }
  }
}
