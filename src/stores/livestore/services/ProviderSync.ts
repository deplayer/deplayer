import type { LiveStore } from '../accessor'
import type {
  AlbumPage,
  IMusicProvider,
  ScanStatus,
} from '../../../providers/IMusicProvider'
import { batchedMediaCommitter } from './BatchedMediaCommitter'
import { resumeFor, save } from './SyncResumeState'
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
// MAX_PAGES_PER_SESSION bounds one sync session per provider so a large
// library never monopolises the main thread; progress resumes next session.
// ---------------------------------------------------------------------------
const SYNC_PAGE_SIZE = 50
const MAX_PAGES_PER_SESSION = 10

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
  | { status: 'paused'; pages: number; cursor: number | null }
  | { status: 'failed'; pages: number }

/**
 * Run one streaming sync cycle for a single Provider.
 *
 * Owns the whole per-provider policy the sync saga used to inline:
 * scan-status gate, resume decision, the page loop (commit with `skipRefresh`,
 * per-page resume save, page cap), and generator cleanup on a paused session.
 *
 * `providerKey` is the settings record key — unique per configured instance —
 * and is what we persist in the resume state. The Provider's own
 * `providerKey` is display-only (and may collide across instances), so it is
 * used only in log messages.
 *
 * Commit contract (deferred mode): pages are added/flushed with
 * `skipRefresh`; the caller performs the single final `refresh` after all
 * providers complete. A page whose flush fails is NOT advanced in the resume
 * state — the rejection propagates out of add/flush before the per-page save,
 * so the next session resumes at that page.
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

    const stream = provider.streamAlbumsSince(since, {
      cursor,
      pageSize: SYNC_PAGE_SIZE,
    })
    let pages = 0
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

      await save(liveStore, providerKey, {
        scanStatus,
        cursor: nextCursor,
        complete,
        pageSize: SYNC_PAGE_SIZE,
      })

      if (complete || pages >= MAX_PAGES_PER_SESSION) break
    }

    if (!complete) {
      await returnStream(stream, provider.providerKey)
      logger.debug(
        `Sync paused for ${provider.providerKey} at cursor ${nextCursor} (page cap reached)`,
      )
      return { status: 'paused', pages, cursor: nextCursor }
    }

    logger.debug(`Sync complete for ${provider.providerKey}`)
    return { status: 'synced', pages }
  } catch (error) {
    logger.error(`Provider sync failed (${provider.providerKey})`, error)
    return { status: 'failed', pages: 0 }
  }
}

/**
 * Best-effort generator cleanup for a paused session. Provider generators
 * currently have no finally block, but a future implementation might.
 * Swallow cleanup errors so they don't poison the sync result.
 */
async function returnStream(
  stream: AsyncGenerator<AlbumPage, void, void>,
  providerKey: string,
): Promise<void> {
  try {
    await stream.return?.()
  } catch (cleanupError) {
    logger.error(`stream.return failed for ${providerKey}`, cleanupError)
  }
}
