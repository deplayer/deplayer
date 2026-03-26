import { useAppStore } from '../store'
import { queryDb } from '@livestore/livestore'
import { tables } from '../schema'
import { useMemo } from 'react'

/**
 * Metadata Hooks - Lightweight queries for filter/facet data
 * 
 * These hooks provide efficient access to collection metadata (genres, providers, types)
 * without loading full media objects. They query only the necessary columns.
 * 
 * Performance improvement:
 * - Before: useMediaLibrary() loads ALL media, then iterates to extract metadata
 * - After: Single column queries with in-memory deduplication
 * 
 * Use these in FilterPanel and similar components that only need facet data.
 */

/**
 * Get all unique genres across the media library
 * 
 * @returns Sorted array of genre names
 * 
 * @example
 * ```tsx
 * const genres = useAvailableGenres()
 * // ['Electronic', 'Jazz', 'Rock', ...]
 * ```
 */
export const useAvailableGenres = (): string[] => {
  const store = useAppStore()
  // Query only the genresFlat column (comma-separated string)
  const result = store.useQuery(
    queryDb(tables.media.select('genresFlat'))
  )
  
  return useMemo(() => {
    const genres = new Set<string>()
    
    if (Array.isArray(result)) {
      result.forEach((row: any) => {
        if (row.genresFlat) {
          row.genresFlat.split(',').forEach((g: string) => {
            const trimmed = g.trim()
            if (trimmed) genres.add(trimmed)
          })
        }
      })
    }
    
    return Array.from(genres).sort()
  }, [result])
}

/**
 * Get all unique providers across the media library
 * 
 * @returns Sorted array of provider names
 * 
 * @example
 * ```tsx
 * const providers = useAvailableProviders()
 * // ['jellyfin', 'subsonic', 'youtube', ...]
 * ```
 */
export const useAvailableProviders = (): string[] => {
  const store = useAppStore()
  // Query only the providersFlat column (comma-separated string)
  const result = store.useQuery(
    queryDb(tables.media.select('providersFlat'))
  )
  
  return useMemo(() => {
    const providers = new Set<string>()
    
    if (Array.isArray(result)) {
      result.forEach((row: any) => {
        if (row.providersFlat) {
          row.providersFlat.split(',').forEach((p: string) => {
            const trimmed = p.trim()
            if (trimmed) providers.add(trimmed)
          })
        }
      })
    }
    
    return Array.from(providers).sort()
  }, [result])
}

/**
 * Get all unique media types across the library
 * 
 * @returns Array of type strings (e.g., 'audio', 'video')
 * 
 * @example
 * ```tsx
 * const types = useAvailableTypes()
 * // ['audio', 'video']
 * ```
 */
export const useAvailableTypes = (): string[] => {
  const store = useAppStore()
  // Query only the type column
  const result = store.useQuery(
    queryDb(tables.media.select('type'))
  )
  
  return useMemo(() => {
    const types = new Set<string>()
    
    if (Array.isArray(result)) {
      result.forEach((row: any) => {
        if (row.type) {
          types.add(row.type)
        }
      })
    }
    
    return Array.from(types).sort()
  }, [result])
}

/**
 * Get count of media items in the library
 * Lightweight alternative to useMediaLibrary().length
 * 
 * @returns Total count of media items
 * 
 * @example
 * ```tsx
 * const count = useMediaCount()
 * // 1234
 * ```
 */
export const useMediaCount = (): number => {
  const store = useAppStore()
  // Use SQL COUNT — returns a number, not an array of IDs
  return store.useQuery(
    queryDb(tables.media.count())
  ) as unknown as number
}

/**
 * Get count of artists in the library
 * 
 * @returns Total count of artists
 */
export const useArtistsCount = (): number => {
  const store = useAppStore()
  return store.useQuery(
    queryDb(tables.artists.count())
  ) as unknown as number
}

/**
 * Get count of albums in the library
 * 
 * @returns Total count of albums
 */
export const useAlbumsCount = (): number => {
  const store = useAppStore()
  return store.useQuery(
    queryDb(tables.albums.count())
  ) as unknown as number
}
