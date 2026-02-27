import { useQuery } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { tables } from '../schema'
import { useMemo } from 'react'

/**
 * Album Query Hooks
 * 
 * These hooks provide reactive access to album data from LiveStore.
 * They automatically update when the underlying data changes.
 */

/**
 * Get all albums from the library
 * 
 * @example
 * ```tsx
 * const albums = useAlbums()
 * return <div>{albums.length} albums</div>
 * ```
 */
export const useAlbums = () => {
  return useQuery(
    queryDb(
      tables.albums
        .select()
        .orderBy('createdAt', 'desc')
    )
  )
}

/**
 * Get all albums as a map indexed by ID for fast lookups
 * 
 * @example
 * ```tsx
 * const albumsMap = useAlbumsMap()
 * const album = albumsMap[albumId]
 * ```
 */
export const useAlbumsMap = () => {
  const albums = useAlbums()
  
  return useMemo(() => {
    const map: Record<string, any> = {}
    if (Array.isArray(albums)) {
      albums.forEach((album: any) => {
        map[album.id] = album
      })
    }
    return map
  }, [albums])
}

/**
 * Get a single album by ID
 * 
 * @example
 * ```tsx
 * const album = useAlbumById('album-123')
 * if (!album) return <div>Not found</div>
 * return <div>{album.name}</div>
 * ```
 */
export const useAlbumById = (id: string | null | undefined) => {
  const result = useQuery(
    queryDb(
      id 
        ? tables.albums.select().where('id', '=', id).limit(1)
        : tables.albums.select().where('id', '=', '__NONE__').limit(1) // Return empty if no id
    )
  )
  return (result as any[])[0] || null
}

/**
 * Get all albums by artist ID
 * 
 * @example
 * ```tsx
 * const albums = useAlbumsByArtist('artist-123')
 * return <div>{albums.length} albums by this artist</div>
 * ```
 */
export const useAlbumsByArtist = (artistId: string | null | undefined) => {
  return useQuery(
    queryDb(
      artistId
        ? tables.albums.select().where('artistId', '=', artistId).orderBy('year', 'desc')
        : tables.albums.select().where('id', '=', '__NONE__') // Return empty if no artistId
    )
  )
}

/**
 * Get album IDs grouped by artist ID
 * Returns a map of artistId -> array of album IDs
 * Matches the Redux collection.albumsByArtist structure
 * 
 * @example
 * ```tsx
 * const albumsByArtist = useAlbumIdsByArtist()
 * const artistAlbums = albumsByArtist['artist-123'] // ['album-1', 'album-2', ...]
 * ```
 */
export const useAlbumIdsByArtist = () => {
  const albums = useQuery(
    queryDb(
      tables.albums
        .select()
        .orderBy('year', 'desc')
    )
  )
  
  return useMemo(() => {
    const map: Record<string, string[]> = {}
    if (Array.isArray(albums)) {
      albums.forEach((album: any) => {
        if (album.artistId) {
          if (!map[album.artistId]) {
            map[album.artistId] = []
          }
          map[album.artistId].push(album.id)
        }
      })
    }
    return map
  }, [albums])
}

/**
 * Get songs grouped by album ID
 * Returns a map of albumId -> array of song IDs
 * 
 * ⚠️ PERFORMANCE WARNING: This loads ALL media in the library.
 * For artist views, use `useSongsByAlbumForArtist(artistId)` instead.
 * 
 * @example
 * ```tsx
 * const songsByAlbum = useSongsByAlbum()
 * const albumSongs = songsByAlbum['album-123'] // ['song-1', 'song-2', ...]
 * ```
 */
export const useSongsByAlbum = () => {
  const media = useQuery(
    queryDb(
      tables.media
        .select()
        .orderBy('track', 'asc')
    )
  )
  
  return useMemo(() => {
    const map: Record<string, string[]> = {}
    if (Array.isArray(media)) {
      media.forEach((song: any) => {
        if (song.albumId) {
          if (!map[song.albumId]) {
            map[song.albumId] = []
          }
          map[song.albumId].push(song.id)
        }
      })
    }
    return map
  }, [media])
}

/**
 * Transform raw LiveStore media data to include nested artist/album objects
 * (Same transformation as useMedia.ts to ensure consistent data shape)
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
 * OPTIMIZED: Get songs grouped by album ID for a specific artist
 * Only fetches media for the given artist, not the entire library.
 * 
 * Performance: O(artist's songs) instead of O(entire library)
 * 
 * @param artistId - Artist ID to fetch songs for
 * @returns Object with:
 *   - songsByAlbum: Map of albumId -> array of song IDs
 *   - mediaMap: Map of songId -> song object (only for this artist's songs)
 *   - allSongIds: Array of all song IDs for this artist
 * 
 * @example
 * ```tsx
 * const { songsByAlbum, mediaMap } = useSongsByAlbumForArtist('artist-123')
 * const albumSongs = songsByAlbum['album-123'] // ['song-1', 'song-2', ...]
 * const song = mediaMap['song-1'] // Full song object with nested artist/album
 * ```
 */
export const useSongsByAlbumForArtist = (artistId: string | null | undefined) => {
  const media = useQuery(
    queryDb(
      artistId
        ? tables.media
            .select()
            .where('artistId', '=', artistId)
            .orderBy('track', 'asc')
        : tables.media.select().where('id', '=', '__NONE__')
    )
  )
  
  return useMemo(() => {
    const songsByAlbum: Record<string, string[]> = {}
    const mediaMap: Record<string, any> = {}
    const allSongIds: string[] = []
    
    if (Array.isArray(media)) {
      media.forEach((rawSong: any) => {
        // Transform to include nested artist/album objects
        const song = transformMediaFromLiveStore(rawSong)
        
        // Build mediaMap for quick lookups
        mediaMap[song.id] = song
        allSongIds.push(song.id)
        
        // Group by album
        if (song.albumId) {
          if (!songsByAlbum[song.albumId]) {
            songsByAlbum[song.albumId] = []
          }
          songsByAlbum[song.albumId].push(song.id)
        }
      })
    }
    
    return { songsByAlbum, mediaMap, allSongIds }
  }, [media])
}

/**
 * Get recently added albums
 * Returns albums sorted by creation date (most recent first)
 * 
 * @param limit - Number of albums to return (default 10)
 * 
 * @example
 * ```tsx
 * const recentAlbums = useRecentAlbums(20)
 * return <div>{recentAlbums.length} recent albums</div>
 * ```
 */
export const useRecentAlbums = (limit = 10) => {
  return useQuery(
    queryDb(
      tables.albums
        .select()
        .orderBy('createdAt', 'desc')
        .limit(limit)
    )
  )
}
