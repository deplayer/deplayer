import { queryDb } from '@livestore/livestore'
import { events, tables } from '../schema'

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
  query: (query: any) => any
  [key: string]: any
}

/**
 * Toggle favorite status for a media track
 * If favorited, unfavorite it. If not favorited, favorite it.
 * 
 * @param store - LiveStore instance from useStore()
 * @param mediaId - Media track ID to toggle
 */
export const toggleFavoriteAction = (store: LiveStore, mediaId: string) => {
  const query = queryDb(
    tables.favorites
      .select()
      .where('mediaId', '=', mediaId)
      .limit(1)
  )
  const result = store.query(query)
  const isFavorited = Array.isArray(result) && result.length > 0
  
  if (isFavorited) {
    store.commit(events.mediaUnfavorited({ mediaId }))
  } else {
    const favoriteId = `fav-${mediaId}-${Date.now()}`
    store.commit(events.mediaFavorited({ id: favoriteId, mediaId }))
  }
  
  return !isFavorited
}

/**
 * Add a media track to favorites
 * 
 * @param store - LiveStore instance from useStore()
 * @param mediaId - Media track ID to favorite
 */
export const addFavoriteAction = (store: LiveStore, mediaId: string) => {
  const query = queryDb(
    tables.favorites
      .select()
      .where('mediaId', '=', mediaId)
      .limit(1)
  )
  const result = store.query(query)
  
  if (!Array.isArray(result) || result.length === 0) {
    const favoriteId = `fav-${mediaId}-${Date.now()}`
    store.commit(events.mediaFavorited({ id: favoriteId, mediaId }))
  }
}

/**
 * Remove a media track from favorites
 * 
 * @param store - LiveStore instance from useStore()
 * @param mediaId - Media track ID to unfavorite
 */
export const removeFavoriteAction = (store: LiveStore, mediaId: string) => {
  store.commit(events.mediaUnfavorited({ mediaId }))
}
