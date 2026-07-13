import { useAppStore } from '../store'
import { queryDb, Schema } from '@livestore/livestore'
import { tables } from '../schema'
import { useMemo } from 'react'
import { useUIStore } from '../../uiStore'
import { useFavoriteIds } from './useFavorites'
import type { TransformedMedia } from './useMedia'
// Parse raw query results into string IDs. Handles both flat string arrays
// (LiveStore select('id') shape) and row-object arrays ({ id: string }).
function parseIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const ids: string[] = []
  for (const r of raw) {
    if (typeof r === 'string') { ids.push(r); continue }
    if (r && typeof r === 'object' && 'id' in r && typeof (r as Record<string, unknown>).id === 'string') {
      ids.push((r as Record<string, string>).id)
    }
  }
  return ids
}

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
  const favoriteIdsArray = useMemo(() => Array.from(favoriteIds), [favoriteIds])

  // Anything that requires client-side post-filtering (JSON arrays, OR across
  // columns) forces us to pull rows. Anything that's purely SQL-expressible
  // (artists / types / favorites / no filter at all) gets the cheap path:
  // SELECT id, let MusicTable's slow path fetch per visible row.
  const hasSearch = searchTerm != null && searchTerm.length >= 3
  const hasProviderFilter = filters.providers.length > 0
  const hasGenreFilter = filters.genres.length > 0
  const canUseGenreReadModel = hasGenreFilter && !hasProviderFilter && !hasSearch
  const needsRowData = hasProviderFilter || hasSearch

  // Build the SQL filter clauses once. Both paths share them.
  const applySqlFilters = <T extends { where: (clause: object) => T }>(q: T): T => {
    let out = q
    if (filters.artists.length > 0) {
      out = out.where({ artistId: { op: 'IN', value: filters.artists } })
    }
    if (filters.types.length > 0) {
      out = out.where({ type: { op: 'IN', value: filters.types } })
    }
    if (filters.favorites && favoriteIdsArray.length > 0) {
      out = out.where({ id: { op: 'IN', value: favoriteIdsArray } })
    }
    return out
  }

  // Fast-path query: ids only.
  const idsQuery = useMemo(() => {
    return applySqlFilters(tables.media.select('id')).orderBy('title', 'asc')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.artists, filters.types, filters.favorites, favoriteIdsArray])

  // Slow-path query: ids + columns needed for client-side filtering.
  const rowsQuery = useMemo(() => {
    return applySqlFilters(
      tables.media.select(
        'id', 'title', 'track', 'artistId', 'artistName',
        'albumId', 'albumName', 'duration', 'cover', 'stream',
        'type', 'genresFlat', 'providersFlat',
      ),
    ).orderBy('title', 'asc')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.artists, filters.types, filters.favorites, favoriteIdsArray])

  // Subscribe to exactly ONE of the two queries. We still call both useQuery
  // hooks (Rules of Hooks) but the inactive one targets an impossible-id
  // filter so it returns []. Each NOOP keeps the same column shape as its
  // active twin so the union type stays consistent.
  const idsNoopQuery = useMemo(
    () => tables.media.select('id').where('id', '=', '__NONE__'),
    [],
  )
  const rowsNoopQuery = useMemo(
    () => tables.media.select(
      'id', 'title', 'track', 'artistId', 'artistName',
      'albumId', 'albumName', 'duration', 'cover', 'stream',
      'type', 'genresFlat', 'providersFlat',
    ).where('id', '=', '__NONE__'),
    [],
  )
  // Genre-only filters use the indexed media_genres join instead of full-row client-side filtering.
  const genreIdsQuery = useMemo(() => {
    if (!canUseGenreReadModel) return idsNoopQuery

    const clauses = ['mg.genre IN (' + filters.genres.map(() => '?').join(',') + ')']
    const bindValues: Record<number, string> = {}
    let idx = 1
    for (const genre of filters.genres) bindValues[idx++] = genre

    if (filters.artists.length > 0) {
      clauses.push('m.artistId IN (' + filters.artists.map(() => '?').join(',') + ')')
      for (const artistId of filters.artists) bindValues[idx++] = artistId
    }

    if (filters.types.length > 0) {
      clauses.push('m.type IN (' + filters.types.map(() => '?').join(',') + ')')
      for (const type of filters.types) bindValues[idx++] = type
    }

    if (filters.favorites && favoriteIdsArray.length > 0) {
      clauses.push('m.id IN (' + favoriteIdsArray.map(() => '?').join(',') + ')')
      for (const id of favoriteIdsArray) bindValues[idx++] = id
    }

    return queryDb({
      query: `
        SELECT DISTINCT m.id AS id
        FROM media m
        INNER JOIN media_genres mg ON mg.mediaId = m.id
        WHERE ${clauses.join(' AND ')}
        ORDER BY m.title ASC
      `,
      bindValues,
      schema: Schema.Array(Schema.Struct({ id: Schema.String })),
    })
  }, [canUseGenreReadModel, filters.genres, filters.artists, filters.types, filters.favorites, favoriteIdsArray, idsNoopQuery])

  const activeIdsQuery = canUseGenreReadModel ? genreIdsQuery : (needsRowData ? idsNoopQuery : idsQuery)
  const idsRaw = store.useQuery(activeIdsQuery as Parameters<typeof store.useQuery>[0])
  const rowsRaw = store.useQuery(queryDb(needsRowData ? rowsQuery : rowsNoopQuery))

  return useMemo(() => {
    if (!needsRowData && !canUseGenreReadModel) {
      // LiveStore returns a single-column select as a flat array of values,
      // not row objects. Guard for both shapes just in case the builder API
      // changes; either way we end up with string ids.
      const ids = parseIds(idsRaw)
      return { ids, map: undefined as Record<string, TransformedMedia> | undefined }
    }

    if (canUseGenreReadModel) {
      // Genre-only path: idsRaw is already the result of the media_genres join query.
      const ids = parseIds(idsRaw)
      return { ids, map: undefined as Record<string, TransformedMedia> | undefined }
    }

    const ids: string[] = []
    const map: Record<string, TransformedMedia> = {}
    if (!Array.isArray(rowsRaw)) return { ids, map }

    const filtered = (rowsRaw as Array<{
      genresFlat?: string
      providersFlat?: string
      title?: string
      artistName?: string
      albumName?: string
    } & Record<string, unknown>>).filter((item) => {
      if (filters.providers.length > 0) {
        const itemProviders = item.providersFlat ? item.providersFlat.split(',') : []
        if (!filters.providers.some((p: string) => itemProviders.includes(p))) return false
      }
      if (searchTerm && searchTerm.length >= 3) {
        const q = searchTerm.toLowerCase()
        const hit =
          item.title?.toLowerCase().includes(q) ||
          item.artistName?.toLowerCase().includes(q) ||
          item.albumName?.toLowerCase().includes(q)
        if (!hit) return false
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
  }, [needsRowData, canUseGenreReadModel, idsRaw, rowsRaw, filters.providers, searchTerm])
}
