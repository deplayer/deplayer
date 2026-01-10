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
