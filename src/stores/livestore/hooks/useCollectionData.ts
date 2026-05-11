import { useAppStore } from '../store'
import { queryDb } from '@livestore/livestore'
import { tables } from '../schema'
import { useMemo } from 'react'
import { useUIStore } from '../../uiStore'
import { useFavoriteIds } from './useFavorites'
import type { TransformedMedia } from './useMedia'

/**
 * Transform raw LiveStore media data to include nested artist/album objects
 */
interface RawMediaRow {
  id: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumName: string;
  cover?: { thumbnailUrl?: string } | null;
  year?: number | null;
  [key: string]: unknown;
}

function transformMediaFromLiveStore(rawMedia: RawMediaRow | Record<string, unknown>): TransformedMedia | null {
  if (!rawMedia) return null
  const media = rawMedia as RawMediaRow

  const artist = {
    id: media.artistId || '',
    name: media.artistName || 'Unknown Artist',
  }

  const album = {
    id: media.albumId || '',
    name: media.albumName || 'Unknown Album',
    artistId: media.artistId || '',
    artist: artist,
    thumbnailUrl: media.cover?.thumbnailUrl || null,
    year: media.year || null,
  }

  return {
    ...(media as unknown as TransformedMedia),
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
export const useCollectionData = () => {
  const store = useAppStore()
  const filters = useUIStore(s => s.activeFilters)
  const searchTerm = useUIStore(s => s.searchTerm)
  const favoriteIds = useFavoriteIds()
  // Convert Set to Array for type compatibility
  const favoriteIdsArray = useMemo(() => Array.from(favoriteIds), [favoriteIds])
  
  // Build optimized SQL query based on active filters
  // Only select columns needed by SongRow + filtering — skip expensive JSON blobs
  // that aren't rendered (genres, externalId, shareUrl, filePath, playCount, etc.)
  const query = useMemo(() => {
    let baseQuery = tables.media.select(
      'id', 'title', 'track', 'artistId', 'artistName',
      'albumId', 'albumName', 'duration', 'cover', 'stream',
      'type', 'genresFlat', 'providersFlat'
    )

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

  return useMemo(() => {
    const ids: string[] = []
    const map: Record<string, TransformedMedia> = {}

    if (!Array.isArray(rawMedia)) {
      return { ids, map }
    }

    const filtered = rawMedia.filter((item: { genresFlat?: string; providersFlat?: string; title?: string; artistName?: string; albumName?: string }) => {
      if (filters.genres.length > 0) {
        const itemGenres = item.genresFlat ? item.genresFlat.split(',') : []
        const hasMatchingGenre = filters.genres.some((g: string) => itemGenres.includes(g))
        if (!hasMatchingGenre) return false
      }

      if (filters.providers.length > 0) {
        const itemProviders = item.providersFlat ? item.providersFlat.split(',') : []
        const hasMatchingProvider = filters.providers.some((p: string) => itemProviders.includes(p))
        if (!hasMatchingProvider) return false
      }

      if (searchTerm && searchTerm.length >= 3) {
        const lowerSearch = searchTerm.toLowerCase()
        const matchesTitle = item.title?.toLowerCase().includes(lowerSearch)
        const matchesArtist = item.artistName?.toLowerCase().includes(lowerSearch)
        const matchesAlbum = item.albumName?.toLowerCase().includes(lowerSearch)
        if (!matchesTitle && !matchesArtist && !matchesAlbum) return false
      }

      return true
    })

    filtered.forEach((item) => {
      const media = transformMediaFromLiveStore(item)
      if (media) {
        ids.push(media.id)
        map[media.id] = media
      }
    })

    return { ids, map }
  }, [rawMedia, filters.genres, filters.providers, searchTerm])
}
