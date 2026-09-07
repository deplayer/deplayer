import type { LiveStore } from '../accessor'
import { syncEvents } from '../events/sync'
import { createLogger } from '../../../utils/logger'

const logger = createLogger({ namespace: 'SyncResumeState' })

/**
 * Sync resume state — one sync_state row per provider key.
 *
 * Owns everything about "where did provider P's incremental sync stop":
 * reading, legacy-row adoption, regression detection (server rescan /
 * library wipe) and cursor-geometry validation. The sync saga only
 * orchestrates: resumeFor -> stream pages -> save.
 *
 * Rows are keyed by provider key so N streaming providers never clobber
 * each other's progress (previously a single 'default' row was shared).
 */

/** Persisted resume facts for one provider. Mirrors the sync_state columns. */
export interface SyncResume {
  lastSyncTimestamp: string
  lastKnownCount: number
  initialSyncCursor: number
  initialSyncComplete: boolean
  /** Page size that produced initialSyncCursor. 0 = unknown (legacy row). */
  cursorPageSize: number
}

export interface ScanStatus {
  scanning: boolean
  count: number
  lastScan: string
}

export interface ResumeDecision {
  /** Delta boundary passed to streamAlbumsSince. null = full sync. */
  since: string | null
  /** Album-list offset for the next page. null = restart the walk. */
  cursor: number | null
}

export interface SaveInput {
  scanStatus: ScanStatus
  /** nextCursor from the last consumed page; null when the stream completed. */
  cursor: number | null
  complete: boolean
  pageSize: number
}

const LEGACY_ROW_ID = 'default'
const RESUME_COLUMNS = 'lastSyncTimestamp, lastKnownCount, initialSyncCursor, initialSyncComplete, cursorPageSize'

function parseResumeRow(row: unknown[]): SyncResume {
  return {
    lastSyncTimestamp: row[0] as string,
    lastKnownCount: row[1] as number,
    initialSyncCursor: row[2] as number,
    initialSyncComplete: row[3] === 1,
    cursorPageSize: (row[4] as number) ?? 0,
  }
}

async function readRow(liveStore: LiveStore, id: string): Promise<SyncResume | null> {
  try {
    const result = await liveStore.query({
      query: `SELECT ${RESUME_COLUMNS} FROM sync_state WHERE id = ?`,
      bindValues: { 1: id },
    })
    const rows = (result as Array<{ values?: unknown[][] }>)?.[0]?.values || []
    return rows.length > 0 ? parseResumeRow(rows[0]) : null
  } catch (error) {
    logger.error(`Failed to read sync_state row '${id}'`, error)
    return null
  }
}

async function writeRow(liveStore: LiveStore, id: string, resume: SyncResume): Promise<void> {
  await liveStore.commit(syncEvents.syncStateUpdatedV2({ id, ...resume }))
}

/**
 * Adopt-once: pre-per-provider installs kept a single 'default' row
 * (semantically the first streaming provider's progress). If providerKey has
 * no row yet, the legacy row is committed under providerKey so user progress
 * survives the cutover. The orphaned 'default' row is left in place.
 */
async function adoptLegacyRow(liveStore: LiveStore, providerKey: string): Promise<SyncResume | null> {
  const legacy = await readRow(liveStore, LEGACY_ROW_ID)
  if (!legacy) return null
  logger.debug(`Adopting legacy sync_state row for provider '${providerKey}'`)
  await writeRow(liveStore, providerKey, legacy)
  return legacy
}

/**
 * Decide where provider `providerKey`'s sync resumes, given the server's
 * current scan status and the page size this session will stream with.
 * Returns null boundaries after a regression (server DB swap, library wipe,
 * invalid timestamps) or a cursor-geometry change (page size differs from
 * the one that produced the stored cursor).
 */
export async function resumeFor(
  liveStore: LiveStore,
  providerKey: string,
  scanStatus: ScanStatus,
  pageSize: number,
): Promise<ResumeDecision> {
  let stored = await readRow(liveStore, providerKey)
  if (!stored) {
    stored = await adoptLegacyRow(liveStore, providerKey)
  }
  if (!stored) return { since: null, cursor: null }

  const serverScanMs = scanStatus.lastScan ? new Date(scanStatus.lastScan).getTime() : NaN
  const localScanMs = stored.lastSyncTimestamp ? new Date(stored.lastSyncTimestamp).getTime() : NaN
  const regressed =
    !Number.isFinite(serverScanMs) ||
    !Number.isFinite(localScanMs) ||
    serverScanMs < localScanMs ||
    scanStatus.count < stored.lastKnownCount
  if (regressed) return { since: null, cursor: null }

  let cursor: number | null = stored.initialSyncCursor
  if (cursor > 0 && stored.cursorPageSize !== pageSize) {
    logger.debug(
      `Cursor geometry changed for '${providerKey}' (${stored.cursorPageSize} -> ${pageSize}); restarting the walk`,
    )
    cursor = null
  }
  return { since: stored.lastSyncTimestamp || null, cursor }
}

/**
 * Persist one page of progress. Rejects propagate to the caller — the saga
 * must NOT advance past a page whose flush failed (see BatchedMediaCommitter).
 */
export async function save(liveStore: LiveStore, providerKey: string, input: SaveInput): Promise<void> {
  await writeRow(liveStore, providerKey, {
    lastSyncTimestamp: input.scanStatus.lastScan,
    lastKnownCount: input.scanStatus.count,
    initialSyncCursor: input.cursor ?? 0,
    initialSyncComplete: input.complete,
    cursorPageSize: input.pageSize,
  })
}
