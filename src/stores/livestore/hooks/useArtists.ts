import { useQuery } from '@livestore/react'
import { queryDb } from '@livestore/livestore'
import { tables } from '../schema'
import { useMemo } from 'react'

/**
 * Artist Query Hooks
 * 
 * These hooks provide reactive access to artist data from LiveStore.
 * They automatically update when the underlying data changes.
 */

/**
 * Get all artists from the library
 * 
 * @example
 * ```tsx
 * const artists = useArtists()
 * return <div>{artists.length} artists</div>
 * ```
 */
export const useArtists = () => {
  return useQuery(
    queryDb(
      tables.artists
        .select()
        .orderBy('name', 'asc')
    )
  )
}

/**
 * Get all artists as a map indexed by ID for fast lookups
 * 
 * @example
 * ```tsx
 * const artistsMap = useArtistsMap()
 * const artist = artistsMap[artistId]
 * ```
 */
export const useArtistsMap = () => {
  const artists = useArtists()
  
  return useMemo(() => {
    const map: Record<string, any> = {}
    if (Array.isArray(artists)) {
      artists.forEach((artist: any) => {
        map[artist.id] = artist
      })
    }
    return map
  }, [artists])
}

/**
 * Get a single artist by ID
 * 
 * @example
 * ```tsx
 * const artist = useArtistById('artist-123')
 * if (!artist) return <div>Not found</div>
 * return <div>{artist.name}</div>
 * ```
 */
export const useArtistById = (id: string | null | undefined) => {
  const result = useQuery(
    queryDb(
      id 
        ? tables.artists.select().where('id', '=', id).limit(1)
        : tables.artists.select().where('id', '=', '__NONE__').limit(1) // Return empty if no id
    )
  )
  return (result as any[])[0] || null
}

/**
 * Get songs grouped by artist ID
 * Returns a map of artistId -> array of song IDs
 * 
 * @example
 * ```tsx
 * const songsByArtist = useSongsByArtist()
 * const artistSongs = songsByArtist['artist-123'] // ['song-1', 'song-2', ...]
 * ```
 */
export const useSongsByArtist = () => {
  const media = useQuery(
    queryDb(
      tables.media
        .select()
        .orderBy('title', 'asc')
    )
  )
  
  return useMemo(() => {
    const map: Record<string, string[]> = {}
    if (Array.isArray(media)) {
      media.forEach((song: any) => {
        if (song.artistId) {
          if (!map[song.artistId]) {
            map[song.artistId] = []
          }
          map[song.artistId].push(song.id)
        }
      })
    }
    return map
  }, [media])
}
