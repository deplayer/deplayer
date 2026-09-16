/**
 * Collection filter module.
 *
 * Single owner of the collection-filter concept: the Filter value object,
 * the match semantics, and the query plan that evaluates it.
 *
 * Semantics (the one contract):
 * - Within a category: OR (any selected value matches).
 * - Across categories: AND (every active category must match).
 * - Genres and providers: exact match.
 * - Favorites active: every result must be a favorite; with zero favorites
 *   in the library the result is empty (never the whole library).
 *
 * Path selection (the planner's job, invisible to callers):
 * - 'ids'        – artists/types/favorites are SQL-expressible: SELECT id.
 * - 'genre-ids'  – genres join the indexed media_genres read model: SQL.
 * - 'rows'       – providers or search need client-side filtering:
 *                  SELECT rows, post-filtered with the SAME predicate
 *                  that defines the semantics. The SQL clauses and the
 *                  client predicate can never disagree.
 *
 * Pure parts (matchesFilter, matchesSearch, parseFilter, plan kind) are
 * testable without LiveStore or React; the query builders are plain
 * schema definitions, so the plan itself is testable the same way.
 */

import { queryDb, Schema } from '@livestore/livestore'
import { tables } from '../schema'

export interface Filter {
  genres: string[]
  types: string[]
  artists: string[]
  providers: string[]
  favorites: boolean
}

export const EMPTY_FILTER: Filter = {
  genres: [],
  types: [],
  artists: [],
  providers: [],
  favorites: false,
}

/**
 * Filters a smart playlist persists (no favorites field in the event
 * schema, so that shape is a projection of Filter).
 */
export type SmartPlaylistFilters = Pick<Filter, 'genres' | 'types' | 'artists' | 'providers'>

/**
 * Minimum shape the predicate needs. Raw query rows are mapped to this
 * (via the denormalized genresFlat/providersFlat columns); parsed
 * MediaRow objects map trivially.
 */
export interface FilterableMedia {
  id: string
  artistId?: string
  type?: string
  genres: string[]
  providers: string[]
  title?: string
  artistName?: string
  albumName?: string
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v) => typeof v === 'string')

/**
 * Normalize a loosely-typed filter (persisted smart-playlist rows, legacy
 * shapes with string-array favorites) into a canonical Filter.
 */
export const parseFilter = (raw: Record<string, unknown> | null | undefined): Filter => {
  if (!raw) return EMPTY_FILTER
  const toList = (value: unknown): string[] => (isStringArray(value) ? value : [])
  const rawFavorites = raw.favorites
  return {
    genres: toList(raw.genres),
    types: toList(raw.types),
    artists: toList(raw.artists),
    providers: toList(raw.providers),
    favorites: Array.isArray(rawFavorites)
      ? rawFavorites[0] === 'true'
      : Boolean(rawFavorites),
  }
}

const matchInCategory = (selected: readonly string[], values: readonly string[]): boolean =>
  selected.some((v) => values.includes(v))

/**
 * The single match semantic. No filters active → true.
 */
export const matchesFilter = (
  filter: Filter,
  media: FilterableMedia,
  favoriteIds: ReadonlySet<string>,
): boolean => {
  if (filter.genres.length > 0 && !matchInCategory(filter.genres, media.genres)) return false
  if (filter.types.length > 0 && !matchInCategory(filter.types, media.type ? [media.type] : [])) return false
  if (filter.artists.length > 0 && !matchInCategory(filter.artists, media.artistId ? [media.artistId] : [])) return false
  if (filter.providers.length > 0 && !matchInCategory(filter.providers, media.providers)) return false
  if (filter.favorites && !favoriteIds.has(media.id)) return false
  return true
}

/**
 * Search over title/artist/album, case-insensitive substring, >= 3 chars.
 */
export const matchesSearch = (
  searchTerm: string,
  media: Pick<FilterableMedia, 'title' | 'artistName' | 'albumName'>,
): boolean => {
  const term = searchTerm.trim().toLowerCase()
  if (term.length < 3) return true
  return Boolean(
    media.title?.toLowerCase().includes(term) ||
    media.artistName?.toLowerCase().includes(term) ||
    media.albumName?.toLowerCase().includes(term)
  )
}

/**
 * Map a raw rows-path query result (denormalized flat columns) into
 * FilterableMedia for the shared predicate.
 */
export const rawRowToFilterable = (row: Record<string, unknown>): FilterableMedia => {
  const splitFlat = (value: unknown): string[] =>
    typeof value === 'string' && value.length > 0 ? value.split(',') : []
  return {
    id: String(row.id ?? ''),
    artistId: row.artistId as string | undefined,
    type: row.type as string | undefined,
    genres: splitFlat(row.genresFlat),
    providers: splitFlat(row.providersFlat),
    title: row.title as string | undefined,
    artistName: row.artistName as string | undefined,
    albumName: row.albumName as string | undefined,
  }
}

/** Parse raw query results into string IDs (flat string arrays or {id} rows). */
export const parseIds = (raw: unknown): string[] => {
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

// ---------------------------------------------------------------------------
// Query plan
// ---------------------------------------------------------------------------

const NOOP_ID = '__NONE__'

const ROW_COLUMNS = [
  'id', 'title', 'track', 'artistId', 'artistName',
  'albumId', 'albumName', 'duration', 'cover', 'stream',
  'type', 'genresFlat', 'providersFlat',
] as const

// Lazy: importing this module must not execute a query. The cached
// instance keeps query identity stable (useQuery memo key).
let cachedNoopIds: unknown
let cachedNoopRows: unknown

export const noopIdsQuery = (): unknown =>
  (cachedNoopIds ??= queryDb(tables.media.select('id').where('id', '=', NOOP_ID)))

export const noopRowsQuery = (): unknown =>
  (cachedNoopRows ??= queryDb(tables.media.select(...ROW_COLUMNS).where('id', '=', NOOP_ID)))

export type CollectionQueryPlan =
  | {
      kind: 'ids' | 'genre-ids'
      activeQuery: unknown
      /** A guaranteed-empty twin so both useQuery hooks stay mounted. */
      inactiveQuery: unknown
    }
  | {
      kind: 'rows'
      activeQuery: unknown
      inactiveQuery: unknown
      /** Post-filter (the shared predicate + search) for the rows path. */
      postFilter: (row: Record<string, unknown>) => boolean
    }

/**
 * Plan a collection query for the given filter and search term.
 *
 * @param filter - canonical Filter
 * @param searchTerm - search term (empty string disables search)
 * @param favoriteIds - current favorite media ids
 */
export const planCollectionQuery = (
  filter: Filter,
  searchTerm: string,
  favoriteIds: readonly string[],
): CollectionQueryPlan => {
  const hasSearch = searchTerm.trim().length >= 3
  const hasProviders = filter.providers.length > 0
  const hasGenres = filter.genres.length > 0
  const hasArtists = filter.artists.length > 0
  const hasTypes = filter.types.length > 0
  const favoritesActive = filter.favorites

  if (favoritesActive && favoriteIds.length === 0) {
    return {
      kind: 'ids',
      activeQuery: noopIdsQuery(),
      inactiveQuery: noopRowsQuery(),
    }
  }

  // SQL-expressible path (no providers, no search).
  if (!hasSearch && !hasProviders) {
    if (hasGenres) {
      return { kind: 'genre-ids', activeQuery: buildGenreJoinQuery(filter, favoriteIds), inactiveQuery: noopRowsQuery() }
    }

    let q = tables.media.select('id').orderBy('title', 'asc')
    if (hasArtists) q = q.where({ artistId: { op: 'IN', value: filter.artists } })
    if (hasTypes) q = q.where({ type: { op: 'IN', value: filter.types } })
    if (favoritesActive) q = q.where({ id: { op: 'IN', value: favoriteIds } })
    return { kind: 'ids', activeQuery: q, inactiveQuery: noopRowsQuery() }
  }

  // Rows path: pull the columns the predicate and MediaRow need, apply the
  // SQL-expressible clauses, and post-filter with the shared predicate.
  let q = tables.media.select(...ROW_COLUMNS).orderBy('title', 'asc')
  if (hasArtists) q = q.where({ artistId: { op: 'IN', value: filter.artists } })
  if (hasTypes) q = q.where({ type: { op: 'IN', value: filter.types } })
  if (favoritesActive) q = q.where({ id: { op: 'IN', value: favoriteIds } })

  const favoriteSet = new Set(favoriteIds)
  const postFilter = (row: Record<string, unknown>): boolean => {
    const media = rawRowToFilterable(row)
    return matchesFilter(filter, media, favoriteSet) && matchesSearch(searchTerm, media)
  }

  return { kind: 'rows', activeQuery: queryDb(q), inactiveQuery: noopIdsQuery(), postFilter }
}

/**
 * Genre filters use the indexed media_genres read model (exact genre match,
 * SQL-side) instead of full-row client-side filtering.
 */
const buildGenreJoinQuery = (
  filter: Filter,
  favoriteIds: readonly string[],
): unknown => {
  const clauses = ['mg.genre IN (' + filter.genres.map(() => '?').join(',') + ')']
  const bindValues: Record<number, string> = {}
  let idx = 1
  for (const genre of filter.genres) bindValues[idx++] = genre

  if (filter.artists.length > 0) {
    clauses.push('m.artistId IN (' + filter.artists.map(() => '?').join(',') + ')')
    for (const artistId of filter.artists) bindValues[idx++] = artistId
  }

  if (filter.types.length > 0) {
    clauses.push('m.type IN (' + filter.types.map(() => '?').join(',') + ')')
    for (const type of filter.types) bindValues[idx++] = type
  }

  if (filter.favorites && favoriteIds.length > 0) {
    clauses.push('m.id IN (' + favoriteIds.map(() => '?').join(',') + ')')
    for (const id of favoriteIds) bindValues[idx++] = id
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
}
