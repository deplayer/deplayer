import { useQuery } from '@livestore/react'
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
  // Get favorite records with media joined
  // Using raw SQL for the JOIN
  return useQuery(
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
  const result = useQuery(
    queryDb(
      mediaId
        ? tables.favorites
            .select()
            .where('mediaId', '=', mediaId)
            .limit(1)
        : tables.favorites.select().where('id', '=', '__NONE__').limit(1)
    )
  )
  
  return (result as any[]).length > 0
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
export const useFavoriteIds = (): Set<string> => {
  const favoriteRecords = useQuery(
    queryDb(
      tables.favorites.select('mediaId')
    )
  )
  
  // IMPORTANT: Wrap in useMemo to prevent creating new Set on every render
  // Without this, every component using this hook would re-render on any state change
  return useMemo(() => {
    const records = favoriteRecords as any[] | undefined
    if (!records || !Array.isArray(records)) return new Set<string>()
    return new Set<string>(records.map(f => f.mediaId))
  }, [favoriteRecords])
}
