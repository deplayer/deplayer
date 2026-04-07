import { Store } from '@livestore/livestore'
import { mediaEvents } from '../events/media'
import { IMedia } from '../../../entities/Media'
import { profiler } from '../../../utils/performanceProfiler'

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
 * All chunks except the last use skipRefresh; the last chunk commits normally
 * so LiveStore's natural reactivity handles the refresh incrementally.
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
    
    // Force flush if batch too large (prevents memory buildup for large imports)
    if (this.pendingMedia.length >= this.MAX_BATCH_SIZE) {
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
  
  // Chunk size for processing - smaller chunks = less main thread blocking
  // Reduced from 100 to 50 to keep each commit under 10ms
  private readonly CHUNK_SIZE = 50
  
  /**
   * Yield to main thread to prevent blocking UI
   * Uses scheduler.yield() if available, otherwise requestAnimationFrame
   * to align with browser frame boundaries
   */
  private yieldToMain(): Promise<void> {
    return new Promise(resolve => {
      if ('scheduler' in window && 'yield' in (window as any).scheduler) {
        (window as any).scheduler.yield().then(resolve)
      } else {
        // Use rAF to yield at frame boundary (better for animations)
        requestAnimationFrame(() => resolve())
      }
    })
  }
  
  
  
  /**
   * Immediately flush all pending media to LiveStore
   * Uses skipRefresh for the commit, then calls manualRefresh() once
   * Processes in chunks to avoid blocking main thread
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
    
    profiler.mark(`flush-start (${mediaToCommit.length} items)`)
    
    try {
      // Query existing IDs to avoid redundant inserts
      profiler.start('query-existing-ids')
      const placeholders = mediaToCommit.map(() => '?').join(',')
      const bindValues = mediaToCommit.reduce((acc, m, i) => {
        acc[i + 1] = m.id
        return acc
      }, {} as Record<number, string>)
      
      const result = await this.store.query({
        query: `SELECT id FROM media WHERE id IN (${placeholders})`,
        bindValues
      })
      profiler.end('query-existing-ids')
      
      const existingIds = new Set<string>()
      const rows = (result as any)?.[0]?.values || []
      rows.forEach((row: any) => existingIds.add(row[0]))
      
      // Filter to only new items
      const newMedia = mediaToCommit.filter(m => !existingIds.has(m.id))
      
      profiler.mark(`filtered: ${newMedia.length} new of ${mediaToCommit.length}`)
      
      if (newMedia.length === 0) {
        profiler.mark('flush-end (no new items)')
        return
      }
      
      // Process ALL chunks with skipRefresh to avoid blocking the main thread.
      // Previously, the last chunk committed without skipRefresh which triggered
      // LiveStore to re-execute ALL reactive queries synchronously — causing 17+
      // second main thread blocks when the collection had thousands of items.
      const totalChunks = Math.ceil(newMedia.length / this.CHUNK_SIZE)
      let chunkIndex = 0
      for (let i = 0; i < newMedia.length; i += this.CHUNK_SIZE) {
        const chunk = newMedia.slice(i, i + this.CHUNK_SIZE)
        
        profiler.start(`chunk-${chunkIndex}-normalize`)
        const normalizedChunk = chunk.map(normalizeMediaForLiveStore)
        profiler.end(`chunk-${chunkIndex}-normalize`)
        
        profiler.start(`chunk-${chunkIndex}-commit`)
        await this.store.commit(
          { skipRefresh: true },
          mediaEvents.mediaBulkAdded({ media: normalizedChunk })
        )
        profiler.end(`chunk-${chunkIndex}-commit`)
        
        // Yield to main thread between chunks to allow UI updates
        if (chunkIndex < totalChunks - 1) {
          profiler.start(`chunk-${chunkIndex}-yield`)
          await this.yieldToMain()
          profiler.end(`chunk-${chunkIndex}-yield`)
        }
        
        chunkIndex++
      }
      
      // Trigger a single refresh after all data is committed.
      // Previously, the last chunk committed without skipRefresh, which
      // re-executed all reactive queries while still inside the commit loop.
      // Now we commit all chunks with skipRefresh, then trigger ONE refresh
      // after yielding to the main thread (so the browser can paint first).
      await this.yieldToMain()
      profiler.start('final-refresh')
      await this.store.commit(
        mediaEvents.mediaBulkAdded({ media: [] })
      )
      profiler.end('final-refresh')
      
      profiler.mark('flush-end')
      profiler.report()
      
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
