import { Store } from '@livestore/livestore'
import { mediaEvents } from '../events/media'
import { IMedia } from '../../../entities/Media'

/**
 * Normalize media object to match LiveStore event schema
 * Handles differences between IMedia structure and event schema
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
      artistId: media.album.artist?.id || media.artist.id, // album.artist.id or fallback to media.artist.id
      thumbnailUrl: media.album.thumbnailUrl ?? undefined, // Convert null to undefined
      year: media.album.year ?? undefined, // Convert null to undefined
    },
    type: media.type,
    duration: media.duration ?? undefined, // Convert null to undefined
    track: media.track ?? undefined, // Convert null to undefined
    discNumber: media.discNumber ?? undefined, // Convert null to undefined
    stream: media.stream,
    cover: media.cover ?? undefined, // Convert null to undefined
    genres: media.genres || [],
    externalId: media.externalId ?? undefined, // Convert null to undefined
    shareUrl: media.shareUrl ?? undefined, // Convert null to undefined
    filePath: media.filePath ?? undefined, // Convert null to undefined
  }
}

/**
 * Add a single media item to the collection
 */
export async function addMediaAction(
  store: Store,
  media: IMedia
): Promise<void> {
  if (!media.id) {
    throw new Error('Media must have an id')
  }
  
  const normalized = normalizeMediaForLiveStore(media)
  await store.commit(mediaEvents.mediaAdded(normalized))
}

/**
 * Add multiple media items to the collection (bulk add)
 * 
 * PHASE 1 OPTIMIZATION:
 * - Pre-filters items that already exist in database (avoids redundant inserts)
 * - Uses mediaBulkAdded event for single transaction (vs N individual transactions)
 * - Performance: 11s → 1-2s (first load), 11s → 50ms (subsequent loads)
 */
export async function addMediaBulkAction(
  store: Store,
  mediaItems: IMedia[]
): Promise<void> {
  // 1. Validate structure and ensure we have string IDs
  const validMedia = mediaItems.filter((m): m is IMedia & { id: string } => {
    if (!m.id || !m.artist?.id || !m.album?.id) {
      return false
    }
    return true
  })
  
  if (validMedia.length === 0) {
    return
  }
  
  // 2. Query which media IDs already exist in database (PHASE 1 OPTIMIZATION)
  const placeholders = validMedia.map(() => '?').join(',')
  const bindValues = validMedia.reduce((acc, m, i) => {
    acc[i + 1] = m.id
    return acc
  }, {} as Record<number, string>)
  
  const result = await store.query({
    query: `SELECT id FROM media WHERE id IN (${placeholders})`,
    bindValues
  })
  
  const existingIds = new Set<string>()
  const rows = (result as any)?.[0]?.values || []
  rows.forEach((row: any) => existingIds.add(row[0]))
  
  // 3. Filter to only new media items
  const newMedia = validMedia.filter(m => !existingIds.has(m.id))
  
  // 4. Only insert new items using bulk event (PHASE 1 OPTIMIZATION)
  if (newMedia.length > 0) {
    const normalizedMedia = newMedia.map(normalizeMediaForLiveStore)
    await store.commit(mediaEvents.mediaBulkAdded({ media: normalizedMedia }))
  }
}

/**
 * Update an existing media item
 */
export async function updateMediaAction(
  store: Store,
  mediaId: string,
  updates: Partial<IMedia>
): Promise<void> {
  await store.commit(mediaEvents.mediaUpdated({
    id: mediaId,
    ...updates
  } as any))
}

/**
 * Remove media from collection
 */
export async function removeMediaAction(
  store: Store,
  mediaId: string
): Promise<void> {
  await store.commit(mediaEvents.mediaRemoved({ id: mediaId }))
}

/**
 * Remove multiple media items from collection
 */
export async function removeMediaBulkAction(
  store: Store,
  mediaIds: string[]
): Promise<void> {
  await store.commit(mediaEvents.mediaBulkRemoved({ mediaIds }))
}

/**
 * Clear entire collection - removes all media
 * Note: This requires querying all media IDs first
 */
export async function clearCollectionAction(
  _store: Store
): Promise<void> {
  // We'll need to get all media IDs and remove them
  // This assumes you have access to the store's query capabilities
  // For now, this is a placeholder that would need the actual implementation
  throw new Error('clearCollectionAction not yet implemented - use removeMediaBulkAction instead')
}

/**
 * Track that a song was played (increment play count)
 */
export async function trackMediaPlayedAction(
  store: Store,
  mediaId: string
): Promise<void> {
  await store.commit(mediaEvents.mediaPlayed({ id: mediaId }))
}
