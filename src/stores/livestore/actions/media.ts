import { Store } from '@livestore/livestore'
import { mediaEvents } from '../events/media'
import { IMedia } from '../../../entities/Media'

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
  
  await store.commit(mediaEvents.mediaAdded(media as any))
}

/**
 * Add multiple media items to the collection (bulk add)
 */
export async function addMediaBulkAction(
  store: Store,
  mediaItems: IMedia[]
): Promise<void> {
  // Filter out media without IDs
  const validMedia = mediaItems.filter(m => m.id)
  
  // Commit events in a batch for better performance
  const eventPromises = validMedia.map(media => 
    store.commit(mediaEvents.mediaAdded(media as any))
  )
  
  await Promise.all(eventPromises)
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
