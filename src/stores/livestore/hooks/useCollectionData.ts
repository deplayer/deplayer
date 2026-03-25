import { useAppStore } from '../store'
import { queryDb } from '@livestore/livestore'
import { tables } from '../schema'
import { useMemo } from 'react'
import type { Filter } from '../../../contexts/UIContext'
import { useFavoriteIds } from './useFavorites'

/**
 * Transform raw LiveStore media data to include nested artist/album objects
 */
function transformMediaFromLiveStore(rawMedia: any): any {
  if (!rawMedia) return null
  
  const artist = {
    id: rawMedia.artistId || '',
    name: rawMedia.artistName || 'Unknown Artist',
  }
  
  const album = {
    id: rawMedia.albumId || '',
    name: rawMedia.albumName || 'Unknown Album',
    artistId: rawMedia.artistId || '',
    artist: artist,
    thumbnailUrl: rawMedia.cover?.thumbnailUrl || null,
    year: rawMedia.year || null,
  }
  
  return {
    ...rawMedia,
    artist,
    album,
  }
}

/**
 * Single optimized reactive query for collection data
 * 
 * This hook combines filtering and media map loading into a single reactive query,
 * preventing the cascade of re-renders that occurs with separate queries.
 * 
 * Performance benefits:
 * - Single database query execution
 * - Single React render when data changes
 * - SQL-level filtering (faster than JS)
 * - No cascading re-renders
 * 
 * @param filters - Active filters from UIContext
 * @param searchTerm - Search term from UIContext
 * @returns Object with filtered IDs and media map
 * 
 * @example
 * ```tsx
 * const { ids, map } = useCollectionData(activeFilters, searchTerm)
 * return <MusicTable tableIds={ids} mediaMap={map} />
 * ```
 */
export const useCollectionData = (filters: Filter, searchTerm: string) => {
  const store = useAppStore()
  const favoriteIds = useFavoriteIds()
  // Convert Set to Array for type compatibility
  const favoriteIdsArray = useMemo(() => Array.from(favoriteIds), [favoriteIds])
  
  // Build optimized SQL query based on active filters
  // This runs at database level for maximum performance
  const query = useMemo(() => {
    let baseQuery = tables.media.select()
    
    // Apply filters using SQL WHERE clauses
    const hasArtists = filters.artists.length > 0
    const hasTypes = filters.types.length > 0
    const hasFavorites = filters.favorites
    
    // Artists filter: Use IN operator for multiple artists
    if (hasArtists) {
      baseQuery = baseQuery.where({ artistId: { op: 'IN', value: filters.artists } })
    }
    
    // Types filter: Use IN operator for multiple types
    if (hasTypes) {
      baseQuery = baseQuery.where({ type: { op: 'IN', value: filters.types } })
    }
    
    // Favorites filter: Use IN operator with favorite IDs
    if (hasFavorites && favoriteIdsArray.length > 0) {
      baseQuery = baseQuery.where({ id: { op: 'IN', value: favoriteIdsArray } })
    }
    
    // Note: Genres and Providers require client-side filtering due to JSON arrays
    // Search also requires client-side filtering (needs OR across title/artist/album,
    // but LiveStore query builder only supports AND)
    // These are filtered in the useMemo below
    
    return baseQuery.orderBy('title', 'asc')
  }, [filters.artists, filters.types, filters.favorites, favoriteIdsArray])
  
  // Execute single reactive query
  const rawMedia = store.useQuery(
    queryDb(query)
  )
  
  // Transform and filter in-memory (fast for typical collection sizes)
  return useMemo(() => {
    const ids: string[] = []
    const map: Record<string, any> = {}
    
    if (!Array.isArray(rawMedia)) {
      return { ids, map }
    }
    
    // Apply client-side filters that can't be done in SQL
    const filtered = rawMedia.filter((item: any) => {
      // Genres filter (JSON array, requires client-side check)
      if (filters.genres.length > 0) {
        const itemGenres = item.genresFlat ? item.genresFlat.split(',') : []
        const hasMatchingGenre = filters.genres.some((g: string) => itemGenres.includes(g))
        if (!hasMatchingGenre) return false
      }
      
      // Providers filter (JSON object, requires client-side check)
      if (filters.providers.length > 0) {
        const itemProviders = item.providersFlat ? item.providersFlat.split(',') : []
        const hasMatchingProvider = filters.providers.some((p: string) => itemProviders.includes(p))
        if (!hasMatchingProvider) return false
      }
      
      // Search term filter (client-side for now, could be moved to SQL with FTS)
      if (searchTerm && searchTerm.length >= 3) {
        const lowerSearch = searchTerm.toLowerCase()
        const matchesTitle = item.title?.toLowerCase().includes(lowerSearch)
        const matchesArtist = item.artistName?.toLowerCase().includes(lowerSearch)
        const matchesAlbum = item.albumName?.toLowerCase().includes(lowerSearch)
        if (!matchesTitle && !matchesArtist && !matchesAlbum) return false
      }
      
      return true
    })
    
    // Build IDs array and map
    filtered.forEach((item: any) => {
      const media = transformMediaFromLiveStore(item)
      ids.push(media.id)
      map[media.id] = media
    })
    
    return { ids, map }
  }, [rawMedia, filters.genres, filters.providers, searchTerm])
}
