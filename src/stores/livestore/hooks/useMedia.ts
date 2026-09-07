import { useAppStore } from '../store'
import { queryDb } from '@livestore/livestore'
import { tables } from '../schema'
import { useMemo } from 'react'
import type { Filter } from '../../uiStore'
import { useFavoriteIds } from './useFavorites'

import type { MediaRow } from '../../../types/media'
import { rawToMediaRow } from '../transformMedia'

/** Parse raw LiveStore rows into MediaRow, dropping nulls. */
function toRows(raw: unknown): MediaRow[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((x) => rawToMediaRow(x) ?? [])
}

// Idle-state convention: every hook's empty-input branch returns a `media`
// query with an impossible-id filter (same pattern as useMediaById below).
// NEVER point these at another table (e.g. sync_state): the sync saga writes
// sync_state once per streamed page (sagas/collection/index.ts), which would
// re-invalidate every idle subscriber on every page during hydration.

/**
 * Media Query Hooks
 * 
 * These hooks provide reactive access to media data from LiveStore.
 * They automatically update when the underlying data changes.
 * 
 * Hooks return raw MediaRow objects (flat fields, JSON fields parsed).
 */

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
  const store = useAppStore()
  const result = store.useQuery(
    queryDb(
      id 
        ? tables.media.select().where('id', '=', id).limit(1)
        : tables.media.select().where('id', '=', '__NONE__').limit(1) // Return empty if no id
    )
  )
  const rawMedia = (result as unknown[])[0] ?? null
  return rawToMediaRow(rawMedia)
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
  const store = useAppStore()
  const rawMedia = store.useQuery(
    queryDb(
      artistId
        ? tables.media
            .select()
            .where('artistId', '=', artistId)
            .orderBy('title', 'asc')
        : tables.media.select().where('id', '=', '__NONE__') // Return empty if no artistId
    )
  )
  
  return useMemo(() => toRows(rawMedia), [rawMedia])
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
  const store = useAppStore()
  const rawMedia = store.useQuery(
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
  
  return useMemo(() => toRows(rawMedia), [rawMedia])
}

/**
 * Search media by title and artist name using LIKE queries
 * 
 * Note: This is not as efficient as FTS5 but works without the FTS extension.
 * LiveStore doesn't support OR conditions, so we fetch results for both
 * title and artist matches separately and merge them client-side.
 * 
 * Performance: LIKE queries use the idx_media_title and idx_media_artistName indexes.
 * 
 * @param searchTerm - Search term to match against title and artist name
 * @param limit - Maximum number of results to return (default: 100)
 * @returns Array of Media objects matching the search term
 * 
 * @example
 * ```tsx
 * const results = useSearchMedia('bohemian')
 * return <div>Found {results.length} matches</div>
 * ```
 */
export const useSearchMedia = (searchTerm: string | undefined | null, limit = 100) => {
  const store = useAppStore()
  // Normalize search term - ensure it's always a valid string
  const term = (searchTerm ?? '').trim()
  const hasSearch = term.length > 0
  
  // Use useMemo to create stable query objects
  const titleQuery = useMemo(() => {
    if (!hasSearch || !term) return queryDb(tables.media.select().where('id', '=', '__NONE__').limit(limit))
    return queryDb(
      tables.media
        .select()
        .where('title', 'LIKE', `%${term}%`)
        .limit(limit)
    )
  }, [hasSearch, term, limit])
  
  const artistQuery = useMemo(() => {
    if (!hasSearch || !term) return queryDb(tables.media.select().where('id', '=', '__NONE__').limit(limit))
    return queryDb(
      tables.media
        .select()
        .where('artistName', 'LIKE', `%${term}%`)
        .limit(limit)
    )
  }, [hasSearch, term, limit])
  
  // Search by title
  const titleMatches = store.useQuery(titleQuery)
  
  // Search by artist name
  const artistMatches = store.useQuery(artistQuery)
  
  return useMemo(() => {
    if (!hasSearch) return []
    
    // Merge results and deduplicate by ID
    const titleResults = Array.isArray(titleMatches) ? titleMatches : []
    const artistResults = Array.isArray(artistMatches) ? artistMatches : []
    
    const seenIds = new Set<string>()
    const mergedResults: MediaRow[] = []
    
    // Add title matches first (prioritize exact title matches)
    // Guard against undefined/null IDs
    for (const m of [...titleResults, ...artistResults]) {
      const row = rawToMediaRow(m)
      if (row?.id && !seenIds.has(row.id)) {
        seenIds.add(row.id)
        mergedResults.push(row)
      }
    }
    
    // Limit total results
    return mergedResults.slice(0, limit)
  }, [titleMatches, artistMatches, hasSearch, limit])
}

/**
 * Search media and return only IDs (optimized for Collection view)
 * 
 * This is more efficient than useSearchMedia when you only need IDs
 * for rendering in MusicTable.
 * 
 * @param searchTerm - Search term to match
 * @param limit - Maximum results (default: 100)
 * @returns Array of media IDs
 * 
 * @example
 * ```tsx
 * const mediaIds = useSearchMediaIds('bohemian')
 * return <MusicTable mediaIds={mediaIds} />
 * ```
 */
export const useSearchMediaIds = (searchTerm: string | undefined | null, limit = 100) => {
  const store = useAppStore()
  const term = (searchTerm ?? '').trim()
  const hasSearch = term.length > 0

  const titleQuery = useMemo(() => {
    if (!hasSearch || !term) {
      return queryDb(tables.media.select('id').where('id', '=', '__NONE__').limit(limit))
    }
    return queryDb(
      tables.media
        .select('id')
        .where('title', 'LIKE', `%${term}%`)
        .limit(limit)
    )
  }, [hasSearch, term, limit])

  const artistQuery = useMemo(() => {
    if (!hasSearch || !term) {
      return queryDb(tables.media.select('id').where('id', '=', '__NONE__').limit(limit))
    }
    return queryDb(
      tables.media
        .select('id')
        .where('artistName', 'LIKE', `%${term}%`)
        .limit(limit)
    )
  }, [hasSearch, term, limit])
  
  // Search by title - only select ID
  const titleMatches = store.useQuery(titleQuery)
  
  // Search by artist name - only select ID
  const artistMatches = store.useQuery(artistQuery)
  
  return useMemo(() => {
    // Early return for no search - most common case on /collection page
    if (!hasSearch) return []
    
    const seenIds = new Set<string>()
    const mergedIds: string[] = []
    
    // Add title match IDs (objects with { id: string })
    // Filter out any undefined/null IDs to prevent downstream query errors
    if (Array.isArray(titleMatches)) {
      for (const result of titleMatches) {
        const id = (result as { id?: string })?.id
        // Guard against undefined/null IDs
        if (id && typeof id === 'string' && !seenIds.has(id)) {
          seenIds.add(id)
          mergedIds.push(id)
        }
      }
    }
    
    // Add artist match IDs
    if (Array.isArray(artistMatches)) {
      for (const result of artistMatches) {
        const id = (result as { id?: string })?.id
        // Guard against undefined/null IDs
        if (id && typeof id === 'string' && !seenIds.has(id)) {
          seenIds.add(id)
          mergedIds.push(id)
        }
      }
    }
    
    return mergedIds.slice(0, limit)
  }, [titleMatches, artistMatches, hasSearch, limit])
}

/**
 * Get recently played media from the playback_history table.
 *
 * Uses a separate table so that playing a track doesn't invalidate
 * all media-table reactive queries (which caused O(4K) re-renders).
 */
export const useRecentlyPlayed = (limit = 20) => {
  const store = useAppStore()

  const recentIds = store.useQuery(
    queryDb(
      tables.playbackHistory
        .select('mediaId')
        .orderBy('playedAt', 'desc')
        .limit(limit)
    )
  )

  const mediaIds = useMemo(() => {
    if (!Array.isArray(recentIds)) return []
    const seen = new Set<string>()
    const ids: string[] = []
    for (const row of recentIds) {
      const id = (row as { mediaId: string }).mediaId
      if (!seen.has(id)) {
        seen.add(id)
        ids.push(id)
      }
    }
    return ids
  }, [recentIds])

  const mediaMap = useMediaMapForIds(mediaIds)

  return useMemo(() => {
    return mediaIds
      .map(id => mediaMap[id])
      .filter((x): x is MediaRow => Boolean(x))
  }, [mediaIds, mediaMap])
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
  const store = useAppStore()
  // Query media with playCount > 0, sorted by playCount descending
  // This is more efficient than loading all and filtering in JS
  const rawMedia = store.useQuery(
    queryDb(
      tables.media
        .select()
        .where({ playCount: { op: '>', value: 0 } })
        .orderBy('playCount', 'desc')
        .limit(limit)
    )
  )
  
  return useMemo(() => toRows(rawMedia), [rawMedia])
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
/**
 * Filtered media with OPTIMIZED database-level filtering
 * 
 * Returns filtered media IDs based on active filters using a hybrid strategy:
 * 
 * **Strategy 1 - Database filtering (FAST):**
 * - Single category filter (artists OR types) with any number of values
 * - Uses SQL IN operator with indexes for maximum performance
 * - Example: "Show all tracks by Artist A, B, or C" → `WHERE artistId IN ('a', 'b', 'c')`
 * 
 * **Strategy 2 - Client-side filtering (OPTIMIZED):**
 * - Multiple categories active (e.g., artists + genres)
 * - Loads only minimal columns (id, artistId, type, genresFlat, providersFlat)
 * - Still 10-50x faster than loading full Media objects
 * 
 * **Performance improvements over old implementation:**
 * - ✅ Uses declarative database indexes from LiveStore schema
 * - ✅ IN operator for multi-value filters (instead of single-value only)
 * - ✅ Minimal column selection (5 columns vs ~20)
 * - ✅ Database-level sorting via orderBy()
 * - Expected: 50-500x faster for single-category filters, 10-50x for complex filters
 * 
 * **Limitation:**
 * LiveStore doesn't support OR conditions between categories (e.g., "artists OR genres")
 * so complex filters fall back to optimized client-side filtering.
 * 
 * @param filters - Active filters from UIContext
 * @returns Array of filtered media IDs
 * 
 * @example
 * ```tsx
 * const { activeFilters } = useUI()
 * const filteredMedia = useFilteredMedia(activeFilters)
 * return <div>{filteredMedia.length} filtered tracks</div>
 * ```
 */
export const useFilteredMedia = (filters: Filter) => {
  const store = useAppStore()
  const favoriteIds = useFavoriteIds()
  
  // Determine which filtering strategy to use
  // Strategy 1: Single category with values -> Use IN operator (database-level, fast)
  // Strategy 2: Multiple categories with values -> Client-side filtering (still faster than before)
  
  const hasArtists = filters.artists.length > 0
  const hasTypes = filters.types.length > 0
  const hasGenres = filters.genres.length > 0
  const hasProviders = filters.providers.length > 0
  const hasFavorites = filters.favorites
  
  const activeFilterCount = [hasArtists, hasTypes, hasGenres, hasProviders, hasFavorites].filter(Boolean).length
  
  // Check if we can use efficient database query (single category filter only)
  const canUseDbQuery = activeFilterCount === 1 && !hasFavorites
  
  // Build database query for single-category filters with IN operator
  const dbQuery = useMemo(() => {
    if (!canUseDbQuery) return null
    
    // Artists filter: Use IN operator for multiple artists
    if (hasArtists) {
      return tables.media
        .select('id')
        .where({ artistId: { op: 'IN', value: filters.artists } })
        .orderBy('title', 'asc')
    }
    
    // Types filter: Use IN operator for multiple types
    if (hasTypes) {
      return tables.media
        .select('id')
        .where({ type: { op: 'IN', value: filters.types } })
        .orderBy('title', 'asc')
    }
    
    return null
  }, [canUseDbQuery, hasArtists, hasTypes, filters.artists, filters.types])
  
  // Execute database query if applicable
  const dbResults = store.useQuery(
    dbQuery ? queryDb(dbQuery) : queryDb(tables.media.select('id').where('id', '=', '__NONE__'))
  )
  
  // Complex case or no filters: Load minimal columns for client-side filtering
  // This is still much faster than before because we only load necessary columns, not full media objects
  // CRITICAL: Only load all media if we're NOT using the optimized DB query
  // This prevents unnecessary large queries when single-category filters can use DB-level filtering
  const shouldLoadAllMedia = !canUseDbQuery
  const allMediaForFiltering = store.useQuery(
    shouldLoadAllMedia
      ? queryDb(
          tables.media
            .select('id', 'artistId', 'type', 'genresFlat', 'providersFlat')
            .orderBy('title', 'asc')
        )
      : queryDb(tables.media.select('id').where('id', '=', '__NONE__'))
  )
  
  return useMemo(() => {
    // If using efficient database query, return those results
    if (canUseDbQuery && Array.isArray(dbResults)) {
      // dbResults contains objects with just 'id' property: [{ id: 'xxx' }, { id: 'yyy' }]
      return dbResults.map((m: { id: string }) => m.id)
    }
    
    // Check if no filters at all
    const hasAnyFilter =
      filters.genres.length > 0 ||
      filters.types.length > 0 ||
      filters.artists.length > 0 ||
      filters.providers.length > 0 ||
      filters.favorites
    
    if (!hasAnyFilter) {
      return Array.isArray(allMediaForFiltering) ? allMediaForFiltering.map((m: { id: string }) => m.id) : []
    }
    
    // Complex filtering: client-side but optimized (only loading minimal columns)
    const filtered = Array.isArray(allMediaForFiltering)
      ? allMediaForFiltering.filter((media: { id: string; artistId?: string; type?: string; genresFlat?: string; providersFlat?: string }) => {
          let matches = false
          
          // Check artists
          if (filters.artists.length > 0 && media.artistId && filters.artists.includes(media.artistId)) {
            matches = true
          }

          // Check types
          if (filters.types.length > 0 && media.type && filters.types.includes(media.type)) {
            matches = true
          }
          
          // Check genres
          if (filters.genres.length > 0) {
            const genresFlat = media.genresFlat || ''
            if (filters.genres.some((g) => genresFlat.includes(g))) {
              matches = true
            }
          }
          
          // Check providers
          if (filters.providers.length > 0) {
            const providersFlat = media.providersFlat || ''
            if (filters.providers.some((p) => providersFlat.includes(p))) {
              matches = true
            }
          }
          
          // Check favorites
          if (filters.favorites && favoriteIds.has(media.id)) {
            matches = true
          }
          
          return matches
        })
      : []
    
    return filtered.map((m) => m.id)
  }, [canUseDbQuery, dbResults, allMediaForFiltering, filters, favoriteIds])
}

/**
 * Get a map of media objects for specific IDs only
 * More efficient than useMediaMap() when you only need a subset
 * 
 * This implements the "clear loading pattern":
 * 1. Get IDs from filtering/search (fast, ID-only queries)
 * 2. Load full objects only for those IDs (efficient, targeted query)
 * 
 * @param ids - Array of media IDs to load
 * @returns Map of media objects keyed by ID
 * 
 * @example
 * ```tsx
 * // Clear pattern: IDs first, then hydrate
 * const filteredIds = useFilteredMedia(filters)
 * const visibleIds = filteredIds.slice(0, 50) // Pagination
 * const mediaMap = useMediaMapForIds(visibleIds) // Only load first 50
 * ```
 */
/**
 * Soft ceiling on caller-supplied id lists. Above this, the IN-list query
 * and the materialized JS map dominate render cost (see the OOM postmortem
 * in docs/plans/2026-05-26-pwa-install-oom-design.md). PlayerContainer's
 * always-mounted subscription to the whole queue was the symptom; the cap
 * is a structural tripwire so the next caller can't slip past silently.
 */
const MEDIA_MAP_SOFT_CAP = 500
let mediaMapOverCapWarned = false

export const useMediaMapForIds = (ids: string[]) => {
  const store = useAppStore()
  // Filter out any undefined/null values and ensure we have valid string IDs
  const validIds = useMemo(
    () => ids.filter((id): id is string => typeof id === 'string' && id.length > 0),
    [ids],
  )

  if (validIds.length > MEDIA_MAP_SOFT_CAP && !mediaMapOverCapWarned) {
    mediaMapOverCapWarned = true
    // eslint-disable-next-line no-console
    console.warn(
      `[useMediaMapForIds] subscribed to ${validIds.length} ids (cap ${MEDIA_MAP_SOFT_CAP}). ` +
        `Use useMediaById per row or paginate.`,
    )
  }

  // Only query if we have valid IDs
  const shouldQuery = validIds.length > 0

  const query = useMemo(() => {
    if (!shouldQuery) {
      return queryDb(tables.media.select().where('id', '=', '__NONE__'))
    }
    return queryDb(
      tables.media
        .select()
        .where({ id: { op: 'IN', value: validIds } })
    )
  }, [shouldQuery, validIds])
  
  const rawMedia = store.useQuery(query)
  
  return useMemo(() => {
    const map: Record<string, MediaRow> = {}
    if (Array.isArray(rawMedia)) {
      rawMedia.forEach((item: Record<string, unknown>) => {
        const row = rawToMediaRow(item)
        if (row) map[row.id] = row
      })
    }
    return map
  }, [rawMedia])
}

