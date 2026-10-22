import { useAppStore } from '../store'
import { queryDb } from '@livestore/livestore'
import { tables } from '../schema'
import { NO_MATCH_ID } from '../query'
import { useMemo } from 'react'

/**
 * Favorites Query Hooks
 * 
 * These hooks provide reactive access to favorited media from LiveStore.
 * They automatically update when the underlying data changes.
 */

/**
 * Check if a specific media item is favorited
 * 
 * @example
 * ```tsx
 * const isFavorite = useIsFavorite('media-123')
 * return <button>{isFavorite ? '♥' : '♡'}</button>
 * ```
 */
export const useIsFavorite = (mediaId: string | null | undefined) => {
  const store = useAppStore()
  const result = store.useQuery(
    queryDb(
      mediaId
        ? tables.favorites
            .select()
            .where('mediaId', '=', mediaId)
            .limit(1)
        : tables.favorites.select().where('id', '=', NO_MATCH_ID).limit(1)
    )
  )
  
  return (result as unknown[]).length > 0
}

/**
 * Get favorite IDs as a Set for quick lookups
 * Useful for rendering large lists where you need to check favorite status
 * 
 * @example
 * ```tsx
 * const favoriteIds = useFavoriteIds()
 * return media.map(m => (
 *   <div>{m.title} {favoriteIds.has(m.id) && '♥'}</div>
 * ))
 * ```
 */
export const useFavoriteIds = (skip = false): Set<string> => {
  const store = useAppStore()
  const favoriteRecords = store.useQuery(
    queryDb(
      skip
        ? tables.favorites.select('mediaId').where('id', '=', NO_MATCH_ID)
        : tables.favorites.select('mediaId')
    )
  )
  
  // Single-column select plucks: rows are mediaId strings, not objects.
  return useMemo(
    () => (skip ? new Set<string>() : new Set<string>(favoriteRecords)),
    [favoriteRecords, skip],
  )
}
