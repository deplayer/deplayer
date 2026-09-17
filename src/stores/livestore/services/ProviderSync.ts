import type { LiveStore } from '../accessor'
import type {
  AlbumPage,
  IMusicProvider,
  ScanStatus,
} from '../../../providers/IMusicProvider'
import { batchedMediaCommitter } from './BatchedMediaCommitter'
import { resumeFor, save } from './SyncResumeState'
import { useUIStore } from '../../uiStore'
import { createLogger } from '../../../utils/logger'

const logger = createLogger({ namespace: 'ProviderSync' })

// ---------------------------------------------------------------------------
// Page policy — owned here, not by the calling saga.
//
// SYNC_PAGE_SIZE is the page geometry streamed AND persisted: resumeFor reads
// it to validate a stored cursor, and save writes it back. Because the same
// constant feeds both, the invariant "the page size that produced a stored
// cursor is the one we page with" is enforced structurally — a change here
// invalidates stored cursors (resumeFor restarts the walk) instead of silently
// skipping albums.
//
// There is no page cap: a sync session streams to completion. The heavy work
// already runs off the main thread (LiveStore leader worker) and the
// committer yields between chunks, so a large library can't stall the UI;
// per-page resume saves keep crash recovery intact.
// ---------------------------------------------------------------------------
const SYNC_PAGE_SIZE = 50

// Progress is published (and the UI refreshed) every N pages, not per page:
// a 62k library streams ~1,240 pages, and per-page UI notifications would
// thrash every reactive consumer. 10 pages x SYNC_PAGE_SIZE = 500 items per
// tick keeps the visible bar moving without hammering the store.
const PROGRESS_REFRESH_PAGES = 10

/** A Provider that supports incremental streaming sync. */
export interface StreamingProvider extends IMusicProvider {
  getScanStatus: () => Promise<ScanStatus>
  streamAlbumsSince: (
    since: string | null,
    opts?: { cursor?: number | null; pageSize?: number },
  ) => AsyncGenerator<AlbumPage, void, void>
}

/** True when a Provider supports incremental streaming sync. */
export function isStreamingProvider(
  provider: Partial<StreamingProvider>,
): provider is StreamingProvider {
  return Boolean(provider.getScanStatus && provider.streamAlbumsSince)
}

export type ProviderSyncResult =
  | { status: 'skipped'; reason: 'scanning' }
  | { status: 'synced'; pages: number }
  | { status: 'failed'; pages: number }

/**
 * Run one streaming sync cycle for a single Provider.
 *
 * Owns the whole per-provider policy the sync saga used to inline:
 * scan-status gate, resume decision, and the page loop (commit with
 * `skipRefresh`, per-page resume save) streaming to completion.
 *
 * `providerKey` is the settings record key — unique per configured instance —
 * and is what we persist in the resume state. The Provider's own
 * `providerKey` is display-only (and may collide across instances), so it is
 * used only in log messages.
 *
 * Commit contract (deferred mode): pages are added/flushed with
 * `skipRefresh`. To keep a long sync visibly alive, every
 * `PROGRESS_REFRESH_PAGES` pages the method publishes progress telemetry to
 * `useUIStore` and performs a `refresh('SyncProvider.progress')` so cheap
 * reactive consumers (counts, the collection view) catch up mid-stream. The
 * caller still owns the single final `refresh` after all providers complete.
 * A page whose flush fails is NOT advanced in the resume state — the
 * rejection propagates out of add/flush before the per-page save, so the next
 * session resumes at that page.
 *
 * Errors (scan status, resume read, provider crash mid-stream, flush failure)
 * are caught and logged; the method resolves with `{ status: 'failed' }` so a
 * single bad Provider never aborts the whole sync.
 */
export async function syncProvider(
  liveStore: LiveStore,
  providerKey: string,
  provider: StreamingProvider,
): Promise<ProviderSyncResult> {
  batchedMediaCommitter.setStore(liveStore)

  let scanStatus: ScanStatus
  try {
    scanStatus = await provider.getScanStatus()
    if (scanStatus.scanning) {
      logger.debug(`Server ${providerKey} is scanning, skipping this cycle`)
      return { status: 'skipped', reason: 'scanning' }
    }

    const { since, cursor } = await resumeFor(
      liveStore,
      providerKey,
      scanStatus,
      SYNC_PAGE_SIZE,
    )

    // Progress telemetry for the Topbar indicator: determinate when the
    // server scan exposes a total (denominator), indeterminate otherwise.
    useUIStore.getState().setSyncProgress({
      active: true,
      added: 0,
      total: scanStatus.count,
    })

    const stream = provider.streamAlbumsSince(since, {
      cursor,
      pageSize: SYNC_PAGE_SIZE,
    })
    let pages = 0
    let added = 0
    let nextCursor: number | null = cursor
    let complete = false

    for (;;) {
      const next = await stream.next()
      if (next.done) {
        complete = true
        break
      }
      const page = next.value

      if (page.media.length > 0) {
        await batchedMediaCommitter.add(page.media, { skipRefresh: true })
        await batchedMediaCommitter.flush({ skipRefresh: true })
      }
      nextCursor = page.nextCursor
      complete = !page.hasMore
      pages++
      added += page.media.length

      await save(liveStore, providerKey, {
        scanStatus,
        cursor: nextCursor,
        complete,
        pageSize: SYNC_PAGE_SIZE,
      })

      // Throttled UI cadence: publish progress and let reactive consumers
      // re-read their cheap queries (COUNT(*), collections) every N pages.
      // The saga's single final refresh stays the authoritative end-of-sync
      // commit for this cycle.
      if (pages % PROGRESS_REFRESH_PAGES === 0) {
        useUIStore.getState().setSyncProgress({
          active: true,
          added,
          total: scanStatus.count,
        })
        await batchedMediaCommitter.refresh('SyncProvider.progress')
      }

      if (complete) break
    }

    logger.debug(`Sync complete for ${provider.providerKey}`)
    return { status: 'synced', pages }
  } catch (error) {
    logger.error(`Provider sync failed (${provider.providerKey})`, error)
    return { status: 'failed', pages: 0 }
  } finally {
    useUIStore.getState().setSyncProgress({ active: false, added: 0, total: 0 })
  }
}
