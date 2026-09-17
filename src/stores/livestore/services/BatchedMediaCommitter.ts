import type { LiveStore } from '../accessor'
import { mediaEvents } from '../events/media'
import { partitionSyncBatch, type ExistingMediaRow } from './mediaDiff'
import { NormalizedMedia } from '../../../utils/normalizeMedia'
import { profiler } from '../../../utils/performanceProfiler'
import { createLogger } from '../../../utils/logger'

const logger = createLogger({ namespace: 'BatchedMediaCommitter' })

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
  private store: LiveStore | null = null
  private isCommitting = false
  private refreshPending = false

  // Configurable thresholds
  private readonly THROTTLE_MS = 100      // Batch window in milliseconds
  private readonly MAX_BATCH_SIZE = 500   // Force flush if exceeded (prevents memory buildup)

  /**
   * Set the LiveStore instance to use for commits
   */
  setStore(store: LiveStore): void {
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
      this.flushTimeout = window.setTimeout(() => {
        this.flush().catch((error) => logger.error('Debounced flush failed; batch re-queued', error))
      }, this.THROTTLE_MS)
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
   * Rejects on failure AFTER re-queueing the failed batch into pendingMedia,
   * so the next flush retries it. Callers must treat rejection as
   * "page not synced" — the sync saga skips its cursor update on rejection.
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
      // Fetch the comparable columns (not just ids): the batch is partitioned
      // into new / changed / unchanged against them, so metadata drift lands
      // as MediaBulkUpdated instead of being silently dropped.
      const EXISTENCE_CHUNK = 500
      const existing = new Map<string, ExistingMediaRow>()
      for (let off = 0; off < mediaToCommit.length; off += EXISTENCE_CHUNK) {
        const slice = mediaToCommit.slice(off, off + EXISTENCE_CHUNK)
        const placeholders = slice.map(() => '?').join(',')
        // Positional array bind: LiveStore maps object keys to $key named
        // params (dropping keys absent from the SQL text), so object-form
        // binds silently never reach the `?` placeholders — the prefilter
        // matched nothing until this was an array. See
        // livestore-bind-contract.spec.ts.
        const result = await this.store!.query({
          query: `SELECT id, type, duration, discNumber, genresFlat, providersFlat, externalId, shareUrl, filePath FROM media WHERE id IN (${placeholders})`,
          bindValues: slice.map(item => item.media.id),
        })
        // Raw store.query returns an array of row objects ({ id, ... }), not
        // the wa-sqlite { values } matrix.
        const rows = (result as Array<ExistingMediaRow>) ?? []
        for (const row of rows) {
          if (row.id !== undefined) existing.set(row.id, row)
        }
      }
      profiler.end('query-existing-ids')

      const { newItems, changedItems } = partitionSyncBatch(mediaToCommit, existing)

      profiler.mark(`partitioned: ${newItems.length} new, ${changedItems.length} changed, ${mediaToCommit.length - newItems.length - changedItems.length} unchanged of ${mediaToCommit.length}`)

      // New rows and drifted rows take different events but the same
      // chunked-commit pipeline.
      const batches: Array<{ label: 'add' | 'update'; items: readonly NormalizedMedia[] }> = []
      if (newItems.length > 0) batches.push({ label: 'add', items: newItems })
      if (changedItems.length > 0) batches.push({ label: 'update', items: changedItems })

      if (batches.length === 0) {
        profiler.mark('flush-end (nothing to commit)')
      } else {
        const totalChunks = batches.reduce(
          (sum, batch) => sum + Math.ceil(batch.items.length / this.CHUNK_SIZE),
          0,
        )
        let chunkIndex = 0
        for (const batch of batches) {
          for (let i = 0; i < batch.items.length; i += this.CHUNK_SIZE) {
            const chunk = batch.items.slice(i, i + this.CHUNK_SIZE)

            profiler.start(`chunk-${chunkIndex}-normalize`)
            const normalizedChunk = chunk.map(toEventPayload)
            profiler.end(`chunk-${chunkIndex}-normalize`)

            profiler.start(`chunk-${chunkIndex}-commit`)
            await this.store.commit(
              { skipRefresh: true },
              batch.label === 'add'
                ? mediaEvents.mediaBulkAdded({ media: normalizedChunk })
                : mediaEvents.mediaBulkUpdated({ media: normalizedChunk }),
            )
            profiler.end(`chunk-${chunkIndex}-commit`)

            if (chunkIndex < totalChunks - 1) {
              profiler.start(`chunk-${chunkIndex}-yield`)
              await this.yieldToMain()
              profiler.end(`chunk-${chunkIndex}-yield`)
            }

            chunkIndex++
          }
        }

        // Successful non-empty commit sets refreshPending so refresh() has work to do.
        this.refreshPending = true

        profiler.mark('flush-end')
        profiler.report()
      }
  } catch (error) {
    // Re-queue BEFORE rejecting so the batch stays recoverable. Re-committing
    // already-committed items is safe: they re-partition as unchanged (or as
    // idempotent updates), and MediaBulkAdded's ON CONFLICT IGNORE still
    // guards the replay window between commit and re-query.
    this.pendingMedia.push(...mediaToCommit)
    throw error
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
