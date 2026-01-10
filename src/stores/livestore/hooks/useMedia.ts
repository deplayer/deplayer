import { useQuery } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { tables } from '../schema'

/**
 * Media Query Hooks
 * 
 * These hooks provide reactive access to media data from LiveStore.
 * They automatically update when the underlying data changes.
 */

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
  return useQuery(
    queryDb(
      tables.media
        .select()
        .orderBy('title', 'asc')
    )
  )
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
  return (result as any[])[0] || null
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
  return useQuery(
    queryDb(
      artistId
        ? tables.media
            .select()
            .where('artistId', '=', artistId)
            .orderBy('title', 'asc')
        : tables.media.select().where('id', '=', '__NONE__') // Return empty if no artistId
    )
  )
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
  return useQuery(
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
  
  return useQuery(
    queryDb(
      term.length > 0
        ? tables.media
            .select()
            .where('title', 'LIKE', `%${term}%`)
            .limit(100)
        : tables.media.select().where('id', '=', '__NONE__') // Return empty if no search term
    )
  )
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
  return useQuery(
    queryDb(
      tables.media
        .select()
        .orderBy('updatedAt', 'desc')
        .limit(limit)
    )
  )
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
  return useQuery(
    queryDb(
      tables.media
        .select()
        .orderBy('playCount', 'desc')
        .limit(limit)
    )
  )
}
