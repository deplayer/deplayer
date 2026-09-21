/**
 * Pure partitioning of a sync batch against existing media rows.
 *
 * The sync committer routes each incoming NormalizedMedia item by whether the
 * database already holds its id and, if so, whether any field the id does not
 * cover has drifted:
 *
 * - no row            → new       (committed as v1.MediaBulkAdded)
 * - row, no drift     → unchanged (dropped; nothing to commit, no churn)
 * - row, drift        → changed   (committed as v1.MediaBulkUpdated)
 *
 * Media ids are content-derived (title/artist/album/track — no provider passes
 * forcedId), so title/artist/album/track can never differ for a stable id; a
 * rename produces a NEW id and flows through the add path. The comparison set
 * below is therefore exactly the updatable surface: type, duration,
 * discNumber, genres, stream membership, externalId, shareUrl, filePath.
 *
 * Deliberately NOT compared: the stream/cover JSON blobs. Their serialized
 * shapes are format-sensitive (key order) and their URLs rotate without
 * semantic change; comparing them would produce update churn, not updates.
 */

import type { NormalizedMedia } from '../../../utils/normalizeMedia'
import { normalizeGenres } from '../../../utils/genres'

/** Columns fetched by the committer's existence/drift SELECT. */
export interface ExistingMediaRow {
  readonly id: string
  readonly type: string | null
  readonly duration: number | null
  readonly discNumber: number | null
  readonly genresFlat: string | null
  readonly providersFlat: string | null
  readonly externalId: string | null
  readonly shareUrl: string | null
  readonly filePath: string | null
}

export interface SyncBatchPartition {
  readonly newItems: readonly NormalizedMedia[]
  readonly changedItems: readonly NormalizedMedia[]
}

const normalizeString = (value: string | null | undefined): string => value ?? ''

const itemDiffers = (item: NormalizedMedia, row: ExistingMediaRow): boolean => {
  const { media } = item
  if (media.type !== row.type) return true
  if ((media.duration ?? null) !== row.duration) return true
  if ((media.discNumber ?? null) !== row.discNumber) return true
  if (normalizeGenres(media.genres).join(',') !== normalizeString(row.genresFlat)) return true
  if (Object.keys(media.stream ?? {}).join(',') !== normalizeString(row.providersFlat)) return true
  if ((media.externalId ?? null) !== row.externalId) return true
  if ((media.shareUrl ?? null) !== row.shareUrl) return true
  if ((media.filePath ?? null) !== row.filePath) return true
  return false
}

/**
 * Partition a sync batch by existence and drift. `existing` maps the ids the
 * SELECT found to their comparable columns; ids absent from the map are new.
 */
export function partitionSyncBatch(
  items: readonly NormalizedMedia[],
  existing: ReadonlyMap<string, ExistingMediaRow>,
): SyncBatchPartition {
  const newItems: NormalizedMedia[] = []
  const changedItems: NormalizedMedia[] = []
  for (const item of items) {
    const row = existing.get(item.media.id)
    if (row === undefined) newItems.push(item)
    else if (itemDiffers(item, row)) changedItems.push(item)
  }
  return { newItems, changedItems }
}
