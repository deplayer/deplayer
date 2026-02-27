import { Store } from '@livestore/livestore'
import { mediaEvents } from '../events/media'
import { IMedia } from '../../../entities/Media'

/**
 * Normalize media object to match LiveStore event schema
 */
function normalizeMediaForLiveStore(media: IMedia): any {
  return {
    id: media.id,
    title: media.title,
    artist: {
      id: media.artist.id,
      name: media.artist.name,
    },
    album: {
      id: media.album.id,
      name: media.album.name,
      artistId: media.album.artist?.id || media.artist.id,
      thumbnailUrl: media.album.thumbnailUrl ?? undefined,
      year: media.album.year ?? undefined,
    },
    type: media.type,
    duration: media.duration ?? undefined,
    track: media.track ?? undefined,
    discNumber: media.discNumber ?? undefined,
    stream: media.stream,
    cover: media.cover ?? undefined,
    genres: media.genres || [],
    externalId: media.externalId ?? undefined,
    shareUrl: media.shareUrl ?? undefined,
    filePath: media.filePath ?? undefined,
  }
}

/**
 * BatchedMediaCommitter - Throttled commit service for LiveStore
 * 
 * Batches multiple provider results into fewer commits to reduce UI refreshes.
 * Uses skipRefresh during batch window, then manualRefresh() at the end.
 * 
 * Performance improvement:
 * - Before: 5 providers = 5 commits = 5 UI refreshes
 * - After: 5 providers within 100ms = 1 commit = 1 UI refresh
 * 
 * @example
 * ```ts
 * batchedMediaCommitter.setStore(liveStore)
 * await batchedMediaCommitter.add(providerAResults)
 * await batchedMediaCommitter.add(providerBResults)
 * // Both batched into single commit after 100ms
 * ```
 */
// Media with validated required fields
type ValidatedMedia = IMedia & { id: string; artist: { id: string; name: string }; album: { id: string; name: string } }

class BatchedMediaCommitter {
  private pendingMedia: ValidatedMedia[] = []
  private flushTimeout: number | null = null
  private store: Store | null = null
  private isCommitting = false
  
  // Configurable thresholds
  private readonly THROTTLE_MS = 100      // Batch window in milliseconds
  private readonly MAX_BATCH_SIZE = 500   // Force flush if exceeded (prevents memory buildup)
  
  /**
   * Set the LiveStore instance to use for commits
   */
  setStore(store: Store): void {
    this.store = store
  }
  
  /**
   * Add media items to the pending batch
   * Items will be committed after THROTTLE_MS of inactivity or when MAX_BATCH_SIZE is reached
   */
  async add(mediaItems: IMedia[]): Promise<void> {
    if (!mediaItems || mediaItems.length === 0) return
    
    // Filter invalid items - ensures all required fields are present
    const validItems = mediaItems.filter((m): m is ValidatedMedia => {
      if (!m.id) {
        console.warn('[BatchedMediaCommitter] Skipping media without ID:', m.title)
        return false
      }
      if (!m.artist?.id || !m.album?.id) {
        console.warn('[BatchedMediaCommitter] Skipping media with incomplete artist/album:', m.id)
        return false
      }
      return true
    })
    
    this.pendingMedia.push(...validItems)
    
    console.log(`[BatchedMediaCommitter] Added ${validItems.length} items, pending: ${this.pendingMedia.length}`)
    
    // Force flush if batch too large (prevents memory buildup for large imports)
    if (this.pendingMedia.length >= this.MAX_BATCH_SIZE) {
      console.log(`[BatchedMediaCommitter] Max batch size reached, forcing flush`)
      await this.flush()
      return
    }
    
    // Debounce: reset timer on each add
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout)
    }
    
    this.flushTimeout = window.setTimeout(() => {
      this.flush()
    }, this.THROTTLE_MS)
  }
  
  /**
   * Immediately flush all pending media to LiveStore
   * Uses skipRefresh for the commit, then calls manualRefresh() once
   */
  async flush(): Promise<void> {
    // Clear timeout if called manually
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout)
      this.flushTimeout = null
    }
    
    // Guard against concurrent flushes or empty batches
    if (this.isCommitting || !this.store || this.pendingMedia.length === 0) {
      return
    }
    
    this.isCommitting = true
    const mediaToCommit = [...this.pendingMedia]
    this.pendingMedia = []
    
    const startTime = performance.now()
    
    try {
      // Query existing IDs to avoid redundant inserts
      const placeholders = mediaToCommit.map(() => '?').join(',')
      const bindValues = mediaToCommit.reduce((acc, m, i) => {
        acc[i + 1] = m.id
        return acc
      }, {} as Record<number, string>)
      
      const result = await this.store.query({
        query: `SELECT id FROM media WHERE id IN (${placeholders})`,
        bindValues
      })
      
      const existingIds = new Set<string>()
      const rows = (result as any)?.[0]?.values || []
      rows.forEach((row: any) => existingIds.add(row[0]))
      
      // Filter to only new items
      const newMedia = mediaToCommit.filter(m => !existingIds.has(m.id))
      
      if (newMedia.length === 0) {
        console.log(`[BatchedMediaCommitter] All ${mediaToCommit.length} items already exist, skipping`)
        return
      }
      
      // Normalize and commit with skipRefresh
      const normalizedMedia = newMedia.map(normalizeMediaForLiveStore)
      
      console.log(`[BatchedMediaCommitter] Committing ${newMedia.length} new items (${existingIds.size} already exist)`)
      
      await this.store.commit(
        { skipRefresh: true },
        mediaEvents.mediaBulkAdded({ media: normalizedMedia })
      )
      
      // Single refresh after commit
      this.store.manualRefresh()
      
      const elapsed = performance.now() - startTime
      console.log(`[BatchedMediaCommitter] ✅ Flushed ${newMedia.length} items in ${elapsed.toFixed(2)}ms`)
      
    } catch (error) {
      console.error('[BatchedMediaCommitter] Flush failed:', error)
      // Re-add failed items to pending for retry
      this.pendingMedia.push(...mediaToCommit)
    } finally {
      this.isCommitting = false
    }
  }
  
  /**
   * Get count of pending items (for debugging/testing)
   */
  getPendingCount(): number {
    return this.pendingMedia.length
  }
  
  /**
   * Clear all pending items without committing (for testing/reset)
   */
  clear(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout)
      this.flushTimeout = null
    }
    this.pendingMedia = []
  }
}

// Singleton instance
export const batchedMediaCommitter = new BatchedMediaCommitter()
