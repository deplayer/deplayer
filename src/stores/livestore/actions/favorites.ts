import { events } from '../schema'

/**
 * LiveStore Favorites Actions
 * 
 * These actions handle favoriting/unfavoriting media tracks.
 * No side effects needed - favorites are pure data operations.
 * 
 * All actions require a store parameter from useStore() hook.
 */

type LiveStore = {
  commit: (event: any) => void
  query: (query: any) => Promise<any>
  [key: string]: any
}

/**
 * Toggle favorite status for a media track
 * If favorited, unfavorite it. If not favorited, favorite it.
 * 
 * @param store - LiveStore instance from useStore()
 * @param mediaId - Media track ID to toggle
 */
export const toggleFavoriteAction = async (store: LiveStore, mediaId: string) => {
  // Check if already favorited using raw SQL query
  const result = await store.query({
    query: `SELECT id FROM favorites WHERE mediaId = ?`,
    bindValues: [mediaId]
  })
  
  const rows = (result as any)?.[0]?.values || []
  const isFavorited = rows.length > 0
  
  if (isFavorited) {
    // Unfavorite
    store.commit(events.mediaUnfavorited({ mediaId }))
  } else {
    // Favorite - generate new ID
    const favoriteId = `fav-${mediaId}-${Date.now()}`
    store.commit(events.mediaFavorited({ id: favoriteId, mediaId }))
  }
  
  return !isFavorited // Return new favorite status
}

/**
 * Add a media track to favorites
 * 
 * @param store - LiveStore instance from useStore()
 * @param mediaId - Media track ID to favorite
 */
export const addFavoriteAction = async (store: LiveStore, mediaId: string) => {
  // Check if already favorited
  const result = await store.query({
    query: `SELECT id FROM favorites WHERE mediaId = ?`,
    bindValues: [mediaId]
  })
  
  const rows = (result as any)?.[0]?.values || []
  
  if (rows.length === 0) {
    // Not favorited yet, add it
    const favoriteId = `fav-${mediaId}-${Date.now()}`
    store.commit(events.mediaFavorited({ id: favoriteId, mediaId }))
  }
  // If already favorited, do nothing (idempotent)
}

/**
 * Remove a media track from favorites
 * 
 * @param store - LiveStore instance from useStore()
 * @param mediaId - Media track ID to unfavorite
 */
export const removeFavoriteAction = async (store: LiveStore, mediaId: string) => {
  store.commit(events.mediaUnfavorited({ mediaId }))
  // Idempotent - if not favorited, delete does nothing
}
