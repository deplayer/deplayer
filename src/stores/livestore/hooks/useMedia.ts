import { useQuery } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { tables } from '../schema'
import { useMemo } from 'react'
import type { Filter } from '../../../contexts/UIContext'
import { useFavoriteIds } from './useFavorites'

/**
 * Media Query Hooks
 * 
 * These hooks provide reactive access to media data from LiveStore.
 * They automatically update when the underlying data changes.
 */

/**
 * Transform raw LiveStore media data to include nested artist/album objects
 * 
 * LiveStore stores artist/album data flat (artistId, artistName, albumId, albumName)
 * but components expect nested objects (artist.id, artist.name, album.id, album.name)
 * 
 * This transformation reconstructs the nested structure while preserving flat fields.
 * 
 * @param rawMedia - Raw media object from LiveStore SQLite query
 * @returns Transformed media with nested artist/album objects
 */
function transformMediaFromLiveStore(rawMedia: any): any {
  if (!rawMedia) return null
  
  // Reconstruct nested artist object from flat fields
  const artist = {
    id: rawMedia.artistId || '',
    name: rawMedia.artistName || 'Unknown Artist',
  }
  
  // Reconstruct nested album object from flat fields
  const album = {
    id: rawMedia.albumId || '',
    name: rawMedia.albumName || 'Unknown Album',
    artistId: rawMedia.artistId || '',
    artist: artist, // Album also references its artist
    thumbnailUrl: rawMedia.cover?.thumbnailUrl || null,
    year: rawMedia.year || null,
  }
  
  return {
    ...rawMedia, // Preserve all original flat fields (artistName, albumName, etc.)
    artist,      // Add nested artist object
    album,       // Add nested album object
  }
}

/**
 * Get all media from the library
 * 
 * @example
 * ```tsx
 * const media = useMediaLibrary()
 * return <div>{media.length} tracks</div>
 * ```
 */
export const useMediaLibrary = () => {
  const rawMedia = useQuery(
    queryDb(
      tables.media
        .select()
        .orderBy('title', 'asc')
    )
  )
  
  return useMemo(() => {
    if (!Array.isArray(rawMedia)) return []
    return rawMedia.map(transformMediaFromLiveStore)
  }, [rawMedia])
}

/**
 * Get all media from the library as a map indexed by ID for fast lookups
 * 
 * @example
 * ```tsx
 * const mediaMap = useMediaMap()
 * const song = mediaMap[songId]
 * ```
 */
export const useMediaMap = () => {
  const media = useMediaLibrary()
  
  return useMemo(() => {
    const map: Record<string, any> = {}
    if (Array.isArray(media)) {
      media.forEach((item: any) => {
        map[item.id] = item
      })
    }
    return map
  }, [media])
}

/**
 * Get a single media item by ID
 * 
 * @example
 * ```tsx
 * const media = useMediaById('media-123')
 * if (!media) return <div>Not found</div>
 * return <div>{media.title}</div>
 * ```
 */
export const useMediaById = (id: string | null | undefined) => {
  const result = useQuery(
    queryDb(
      id 
        ? tables.media.select().where('id', '=', id).limit(1)
        : tables.media.select().where('id', '=', '__NONE__').limit(1) // Return empty if no id
    )
  )
  const rawMedia = (result as any[])[0] || null
  return transformMediaFromLiveStore(rawMedia)
}

/**
 * Get all media by artist ID
 * 
 * @example
 * ```tsx
 * const tracks = useMediaByArtist('artist-123')
 * return <div>{tracks.length} tracks by this artist</div>
 * ```
 */
export const useMediaByArtist = (artistId: string | null | undefined) => {
  const rawMedia = useQuery(
    queryDb(
      artistId
        ? tables.media
            .select()
            .where('artistId', '=', artistId)
            .orderBy('title', 'asc')
        : tables.media.select().where('id', '=', '__NONE__') // Return empty if no artistId
    )
  )
  
  return useMemo(() => {
    if (!Array.isArray(rawMedia)) return []
    return rawMedia.map(transformMediaFromLiveStore)
  }, [rawMedia])
}

/**
 * Get all media by album ID
 * 
 * @example
 * ```tsx
 * const tracks = useMediaByAlbum('album-123')
 * return <div>{tracks.length} tracks in this album</div>
 * ```
 */
export const useMediaByAlbum = (albumId: string | null | undefined) => {
  const rawMedia = useQuery(
    queryDb(
      albumId
        ? tables.media
            .select()
            .where('albumId', '=', albumId)
            .orderBy('track', 'asc') // Order by track number
            .orderBy('title', 'asc')
        : tables.media.select().where('id', '=', '__NONE__') // Return empty if no albumId
    )
  )
  
  return useMemo(() => {
    if (!Array.isArray(rawMedia)) return []
    return rawMedia.map(transformMediaFromLiveStore)
  }, [rawMedia])
}

/**
 * Search media by title, using LIKE query
 * Note: This is not as efficient as FTS5 but works without FTS extension
 * 
 * @example
 * ```tsx
 * const results = useSearchMedia('bohemian')
 * return <div>Found {results.length} matches</div>
 * ```
 */
export const useSearchMedia = (searchTerm: string) => {
  const term = searchTerm.trim()
  
  const rawMedia = useQuery(
    queryDb(
      term.length > 0
        ? tables.media
            .select()
            .where('title', 'LIKE', `%${term}%`)
            .limit(100)
        : tables.media.select().where('id', '=', '__NONE__') // Return empty if no search term
    )
  )
  
  return useMemo(() => {
    if (!Array.isArray(rawMedia)) return []
    return rawMedia.map(transformMediaFromLiveStore)
  }, [rawMedia])
}

/**
 * Get recently played media (sorted by updatedAt, which is updated on play)
 * 
 * @param limit - Number of items to return (default 20)
 * 
 * @example
 * ```tsx
 * const recent = useRecentlyPlayed(10)
 * return <div>Last 10 played tracks</div>
 * ```
 */
export const useRecentlyPlayed = (limit = 20) => {
  const rawMedia = useQuery(
    queryDb(
      tables.media
        .select()
        .orderBy('updatedAt', 'desc')
        .limit(limit)
    )
  )
  
  return useMemo(() => {
    if (!Array.isArray(rawMedia)) return []
    return rawMedia.map(transformMediaFromLiveStore)
  }, [rawMedia])
}

/**
 * Get most played media (sorted by playCount)
 * 
 * @param limit - Number of items to return (default 20)
 * 
 * @example
 * ```tsx
 * const topTracks = useMostPlayed(50)
 * return <div>Top 50 most played tracks</div>
 * ```
 */
export const useMostPlayed = (limit = 20) => {
  const rawMedia = useQuery(
    queryDb(
      tables.media
        .select()
        .orderBy('playCount', 'desc')
        .limit(limit)
    )
  )
  
  return useMemo(() => {
    if (!Array.isArray(rawMedia)) return []
    return rawMedia.map(transformMediaFromLiveStore)
  }, [rawMedia])
}

/**
 * Get filtered media based on active filters
 * Applies genre, type, artist, provider, and favorites filters to all media
 * 
 * @param filters - Active filter state from UIContext
 * 
 * @example
 * ```tsx
 * const { activeFilters } = useUI()
 * const filteredMedia = useFilteredMedia(activeFilters)
 * return <div>{filteredMedia.length} filtered tracks</div>
 * ```
 */
export const useFilteredMedia = (filters: Filter) => {
  const allMedia = useMediaLibrary()
  const favoriteIds = useFavoriteIds()
  
  return useMemo(() => {
    // If no filters are active, return all media IDs
    if (
      filters.genres.length === 0 &&
      filters.types.length === 0 &&
      filters.artists.length === 0 &&
      filters.providers.length === 0 &&
      !filters.favorites
    ) {
      return Array.isArray(allMedia) ? allMedia.map((m: any) => m.id) : []
    }

    // Filter media based on active filters
    // Now uses denormalized columns (genresFlat, providersFlat) for better performance
    const filtered = Array.isArray(allMedia) 
      ? allMedia.filter((media: any) => {
          let hasMatches = false

          // Check artists (indexed artistId column)
          if (filters.artists.length > 0) {
            if (filters.artists.includes(media.artistId)) {
              hasMatches = true
            }
          }

          // Check genres (denormalized genresFlat column)
          if (filters.genres.length > 0) {
            const genresFlat = media.genresFlat || ''
            if (filters.genres.some((g) => genresFlat.includes(g))) {
              hasMatches = true
            }
          }

          // Check types
          if (filters.types.length > 0) {
            if (filters.types.includes(media.type)) {
              hasMatches = true
            }
          }

          // Check providers (denormalized providersFlat column)
          if (filters.providers.length > 0) {
            const providersFlat = media.providersFlat || ''
            if (filters.providers.some((p) => providersFlat.includes(p))) {
              hasMatches = true
            }
          }

          // Check favorites
          if (filters.favorites) {
            if (favoriteIds.has(media.id)) {
              hasMatches = true
            }
          }

          return hasMatches
        })
      : []
    
    return filtered.map((m: any) => m.id)
  }, [allMedia, filters, favoriteIds])
}
