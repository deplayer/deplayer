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
 * Options for add/flush that control when reactive refresh occurs.
 * When `skipRefresh` is true, the caller owns refresh via `refresh()`.
 */
export type FlushOptions = { readonly skipRefresh?: boolean }

/**
 * BatchedMediaCommitter - Throttled commit service for LiveStore
 *
 * Batches multiple provider results into fewer commits to reduce UI refreshes.
 * All chunks use skipRefresh; callers invoke `refresh()` for the reactive cascade.
 *
 * Deferred mode (caller owns refresh):
 * ```ts
 * batchedMediaCommitter.setStore(liveStore)
 * await batchedMediaCommitter.add(page.media, { skipRefresh: true })
 * await batchedMediaCommitter.flush({ skipRefresh: true })
 * // ... more pages ...
 * await batchedMediaCommitter.refresh('SyncSaga')
 * ```
 *
 * Default mode (backward-compatible, refresh on flush):
 * ```ts
 * await batchedMediaCommitter.add(results)
 * await batchedMediaCommitter.flush()
 * ```
 */

class BatchedMediaCommitter {
  private pendingMedia: NormalizedMedia[] = []
  private flushTimeout: number | null = null
  private store: Store | null = null
  private isCommitting = false
  private refreshPending = false

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
   * Add media items to the pending batch.
   * Items are committed immediately (in chunks) when MAX_BATCH_SIZE is reached,
   * or after THROTTLE_MS of inactivity. Options propagate to forced and debounced flushes.
   */
  async add(mediaItems: NormalizedMedia[], options?: FlushOptions): Promise<void> {
    if (!mediaItems || mediaItems.length === 0) return

    const skipRefresh = options?.skipRefresh ?? false

    let i = 0
    while (i < mediaItems.length) {
      const room = this.MAX_BATCH_SIZE - this.pendingMedia.length
      if (room > 0) {
        const take = Math.min(room, mediaItems.length - i)
        for (let k = 0; k < take; k++) this.pendingMedia.push(mediaItems[i + k])
        i += take
      }
      if (this.pendingMedia.length < this.MAX_BATCH_SIZE) break

      const before = this.pendingMedia.length
      await this.flush({ skipRefresh })
      if (this.pendingMedia.length >= before && i < mediaItems.length) {
        throw new Error(
          `BatchedMediaCommitter.add: flush() did not drain ${this.pendingMedia.length} items; ` +
          `${mediaItems.length - i} input items not buffered. Inspect prior flush errors.`,
        )
      }
    }

    // Deferred mode: caller controls flush timing, no debounce needed.
    if (!skipRefresh) {
      clearTimeout(this.flushTimeout as number | undefined)
      this.flushTimeout = window.setTimeout(() => { this.flush() }, this.THROTTLE_MS)
    }
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
   * Immediately flush all pending media to LiveStore.
   * When `skipRefresh` is true, sets refreshPending without calling manualRefresh.
   * Default (no options) calls `refresh()` at the end.
   */
  async flush(options?: FlushOptions): Promise<void> {
    const skipRefresh = options?.skipRefresh ?? false

    // Clear timeout if called manually
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout)
      this.flushTimeout = null
    }

    // Guard against concurrent flushes or empty batches
    if (this.isCommitting || !this.store || this.pendingMedia.length === 0) {
      // Deferred path still needs to honour the refresh decision.
      if (!skipRefresh && this.refreshPending) {
        await this.refresh('BatchedMediaCommitter.flush')
      }
      return
    }

    this.isCommitting = true
    const mediaToCommit = this.pendingMedia
    this.pendingMedia = []

    profiler.mark(`flush-start (${mediaToCommit.length} items)`)

    try {
      profiler.start('query-existing-ids')
      const EXISTENCE_CHUNK = 500
      const existingIds = new Set<string>()
      for (let off = 0; off < mediaToCommit.length; off += EXISTENCE_CHUNK) {
        const slice = mediaToCommit.slice(off, off + EXISTENCE_CHUNK)
        const placeholders = slice.map(() => '?').join(',')
        const bindValues: Record<number, string> = {}
        for (let k = 0; k < slice.length; k++) bindValues[k + 1] = slice[k].media.id
        const result = await this.store!.query({
          query: `SELECT id FROM media WHERE id IN (${placeholders})`,
          bindValues,
        })
        const rows = (result as Array<{ values?: string[][] }>)?.[0]?.values || []
        for (const row of rows) existingIds.add(row[0])
      }
      profiler.end('query-existing-ids')

      const newMedia = mediaToCommit.filter(m => !existingIds.has(m.media.id))

      profiler.mark(`filtered: ${newMedia.length} new of ${mediaToCommit.length}`)

      if (newMedia.length === 0) {
        profiler.mark('flush-end (no new items)')
      } else {
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
            mediaEvents.mediaBulkAdded({ media: normalizedChunk }),
          )
          profiler.end(`chunk-${chunkIndex}-commit`)

          if (chunkIndex < totalChunks - 1) {
            profiler.start(`chunk-${chunkIndex}-yield`)
            await this.yieldToMain()
            profiler.end(`chunk-${chunkIndex}-yield`)
          }

          chunkIndex++
        }

        // Successful non-empty commit sets refreshPending so refresh() has work to do.
        this.refreshPending = true

        profiler.mark('flush-end')
        profiler.report()
      }
    } catch (error) {
      console.error('[BatchedMediaCommitter] Flush failed:', error)
      this.pendingMedia.push(...mediaToCommit)
    } finally {
      this.isCommitting = false
    }

    // Default mode: refresh now. Deferred mode: caller invokes refresh() later.
    if (!skipRefresh) {
      await this.refresh('BatchedMediaCommitter.flush')
    }
  }

  /**
   * Trigger reactive refresh of all subscribed queries.
   * No-op when no store is set or refreshPending is false.
   * Defers to browser idle time before calling manualRefresh.
   */
  async refresh(label: string): Promise<void> {
    if (!this.store || !this.refreshPending) return

    // Clear immediately so concurrent flushes don't double-refresh.
    this.refreshPending = false

    await this.waitForIdle()
    profiler.start('final-refresh')
    this.store.manualRefresh({ label })
    profiler.end('final-refresh')
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
    clearTimeout(this.flushTimeout as number | undefined)
    this.flushTimeout = null
    this.pendingMedia = []
    this.refreshPending = false
    this.isCommitting = false
    this.store = null
  }
}

// Singleton instance
export const batchedMediaCommitter = new BatchedMediaCommitter()
