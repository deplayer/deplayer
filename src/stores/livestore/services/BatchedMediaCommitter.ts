import { Store } from '@livestore/livestore'
import { mediaEvents } from '../events/media'
import { NormalizedMedia } from '../../../utils/normalizeMedia'
import { profiler } from '../../../utils/performanceProfiler'

/**
 * Convert NormalizedMedia to the shape expected by LiveStore media events
 */
function toEventPayload(item: NormalizedMedia) {
  const { media, artist, album } = item
  return {
    id: media.id,
    title: media.title,
    artist: {
      id: artist.id,
      name: artist.name,
    },
    album: {
      id: album.id,
      name: album.name,
      artistId: album.artistId,
      thumbnailUrl: album.thumbnailUrl ?? undefined,
      year: album.year ?? undefined,
    },
    type: media.type,
    duration: media.duration || undefined,
    track: media.track ?? undefined,
    discNumber: media.discNumber ?? undefined,
    stream: media.stream,
    cover: media.cover ?? undefined,
    genres: media.genres,
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

class BatchedMediaCommitter {
  private pendingMedia: NormalizedMedia[] = []
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
  async add(mediaItems: NormalizedMedia[]): Promise<void> {
    if (!mediaItems || mediaItems.length === 0) return

    let i = 0
    while (i < mediaItems.length) {
      const room = this.MAX_BATCH_SIZE - this.pendingMedia.length
      if (room > 0) {
        const take = Math.min(room, mediaItems.length - i)
        // slice to avoid push(...) stack-overflow on huge arrays
        for (let k = 0; k < take; k++) this.pendingMedia.push(mediaItems[i + k])
        i += take
      }
      if (this.pendingMedia.length < this.MAX_BATCH_SIZE) break

      const before = this.pendingMedia.length
      await this.flush()
      // If flush() failed and re-queued, pendingMedia.length stays at MAX_BATCH_SIZE
      // (room === 0 forever). Bail out so the caller doesn't loop infinitely; the
      // trailing debounce setTimeout below still gives the next add() a chance to
      // drain once conditions improve.
      if (this.pendingMedia.length >= before && i < mediaItems.length) break
    }

    if (this.flushTimeout) clearTimeout(this.flushTimeout)
    this.flushTimeout = window.setTimeout(() => { this.flush() }, this.THROTTLE_MS)
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
      if ('scheduler' in window && 'yield' in (window as unknown as { scheduler: { yield: () => Promise<void> } }).scheduler) {
        (window as unknown as { scheduler: { yield: () => Promise<void> } }).scheduler.yield().then(resolve)
      } else {
        requestAnimationFrame(() => resolve())
      }
    })
  }

  /**
   * Wait until the browser is idle before proceeding.
   * This ensures expensive reactive refreshes don't block user interactions.
   * Falls back to a 100ms delay if requestIdleCallback is unavailable.
   */
  private waitForIdle(): Promise<void> {
    return new Promise(resolve => {
      if ('requestIdleCallback' in window) {
        (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void })
          .requestIdleCallback(() => resolve(), { timeout: 2000 })
      } else {
        setTimeout(resolve, 100)
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
        acc[i + 1] = m.media.id
        return acc
      }, {} as Record<number, string>)

      const result = await this.store.query({
        query: `SELECT id FROM media WHERE id IN (${placeholders})`,
        bindValues
      })
      profiler.end('query-existing-ids')

      const existingIds = new Set<string>()
      const rows = (result as Array<{ values?: string[][] }>)?.[0]?.values || []
      rows.forEach((row: string[]) => existingIds.add(row[0]))

      // Filter to only new items
      const newMedia = mediaToCommit.filter(m => !existingIds.has(m.media.id))

      profiler.mark(`filtered: ${newMedia.length} new of ${mediaToCommit.length}`)

      if (newMedia.length === 0) {
        profiler.mark('flush-end (no new items)')
        return
      }

      // Process ALL chunks with skipRefresh to avoid blocking the main thread.
      const totalChunks = Math.ceil(newMedia.length / this.CHUNK_SIZE)
      let chunkIndex = 0
      for (let i = 0; i < newMedia.length; i += this.CHUNK_SIZE) {
        const chunk = newMedia.slice(i, i + this.CHUNK_SIZE)

        profiler.start(`chunk-${chunkIndex}-normalize`)
        const normalizedChunk = chunk.map(toEventPayload)
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

      // Trigger reactive refresh only when the browser is idle.
      // This prevents the expensive O(N) query re-execution from blocking
      // scroll/animations when the collection is open with thousands of items.
      //
      // manualRefresh is a LiveStore client-side API: it re-runs subscribed
      // queries without appending a no-op event to the log (previous impl
      // committed mediaBulkAdded({ media: [] }) just to force this).
      await this.waitForIdle()
      profiler.start('final-refresh')
      this.store.manualRefresh({ label: 'BatchedMediaCommitter.flush' })
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
