import { useAppStore } from '../store'
import { queryDb } from '@livestore/livestore'
import { tables } from '../schema'
import { useMemo } from 'react'

/**
 * Favorites Query Hooks
 * 
 * These hooks provide reactive access to favorited media from LiveStore.
 * They automatically update when the underlying data changes.
 */

/**
 * Get all favorited media
 * 
 * @example
 * ```tsx
 * const favorites = useFavorites()
 * return <div>{favorites.length} favorites</div>
 * ```
 */
export const useFavorites = () => {
  const store = useAppStore()
  // Get favorite records with media joined
  // Using raw SQL for the JOIN
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return store.useQuery(
    queryDb({
      query: `
        SELECT m.*, f.createdAt as favorited_at
        FROM favorites f
        JOIN media m ON f.mediaId = m.id
        ORDER BY f.createdAt DESC
      `,
      bindValues: {}
    } as any)
  )
}

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
        : tables.favorites.select().where('id', '=', '__NONE__').limit(1)
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
        ? tables.favorites.select('mediaId').where('id', '=', '__NONE__')
        : tables.favorites.select('mediaId')
    )
  )
  
  return useMemo(() => {
    if (skip) return new Set<string>()
    const records = favoriteRecords as unknown as Array<{ mediaId: string }> | undefined
    if (!records || !Array.isArray(records)) return new Set<string>()
    return new Set<string>(records.map(f => f.mediaId))
  }, [favoriteRecords, skip])
}
