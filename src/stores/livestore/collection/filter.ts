/**
 * Collection filter module.
 *
 * Owns every match semantic for the collection list as SQL clauses, and
 * exposes three queries built from those clauses:
 *
 * - `collectionWindowQuery` — a bounded snapshot of full rows, ordered by
 *   `(title, id)`, refreshed only when the caller refetches (filter/search
 *   change or window growth). Deliberately not subscribed: sync commits
 *   cannot shift rows under the user's scroll position.
 * - `collectionCountQuery` — a live aggregate for the same clauses.
 * - `collectionAllIdsQuery` — the unbounded id list for one-shot consumers
 *   (Play All, smart playlists) that need the whole filtered collection.
 *
 * All three share one clause builder, so the WHERE semantics cannot drift
 * between the count and the rows it counts.
 *
 * Match semantics (parity with the previous client-side predicate):
 * - OR within a category, AND across categories.
 * - Genres match exactly via the indexed `media_genres` read model.
 * - Providers match exactly by token in the denormalized `providersFlat` CSV.
 */

import { queryDb, Schema } from '@livestore/livestore'
import { MEDIA_ROW_COLUMNS_SQL, mediaRowSchema } from '../query'

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
    favorites:
      rawFavorites === true ||
      (Array.isArray(rawFavorites) && rawFavorites.includes('true')),
  }
}

/** Parse raw query results into string IDs (flat string arrays or {id} rows). */
export const parseIds = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) return []
  const ids: string[] = []
  for (const r of raw) {
    if (typeof r === 'string') {
      ids.push(r)
      continue
    }
    if (r && typeof r === 'object' && 'id' in r && typeof (r as Record<string, unknown>).id === 'string') {
      ids.push((r as Record<string, string>).id)
    }
  }
  return ids
}

// ---------------------------------------------------------------------------
// Clause builder — the single owner of match semantics
// ---------------------------------------------------------------------------

export interface CollectionClauses {
  /** Empty string when unfiltered; otherwise a `?`-parameterized predicate. */
  readonly where: string
  /** Positional binds, in `?` appearance order (array form is required). */
  readonly bindValues: readonly string[]
  /** Genre filters require the indexed media_genres join. */
  readonly genreJoin: boolean
}
/** Escape LIKE wildcards so a user term containing %/_/\\ matches literally. */
const escapeLike = (term: string): string => term.replace(/[\\%_]/g, (ch) => `\\${ch}`)

export const buildCollectionClauses = (
  filter: Filter,
  searchTerm: string,
  favoriteIds: readonly string[],
): CollectionClauses => {
  // Favorites active with nothing favorited can never match; keep one query
  // shape by short-circuiting to an unsatisfiable predicate.
  if (filter.favorites && favoriteIds.length === 0) {
    return { where: '1 = 0', bindValues: [], genreJoin: false }
  }

  const clauses: string[] = []
  // Positional binds in `?` appearance order. MUST stay an array: LiveStore's
  // prepareBindValues maps object-form keys to `$key` named params and drops
  // keys whose text is absent from the SQL, so numeric-keyed objects can
  // never feed positional placeholders.
  const bindValues: string[] = []

  if (filter.genres.length > 0) {
    clauses.push(`mg.genre IN (${filter.genres.map(() => '?').join(',')})`)
    bindValues.push(...filter.genres)
  }

  if (filter.artists.length > 0) {
    clauses.push(`m.artistId IN (${filter.artists.map(() => '?').join(',')})`)
    bindValues.push(...filter.artists)
  }

  if (filter.types.length > 0) {
    clauses.push(`m.type IN (${filter.types.map(() => '?').join(',')})`)
    bindValues.push(...filter.types)
  }

  if (filter.favorites) {
    clauses.push(`m.id IN (${favoriteIds.map(() => '?').join(',')})`)
    bindValues.push(...favoriteIds)
  }

  if (filter.providers.length > 0) {
    // Exact token match against the denormalized CSV: ',a,' never matches
    // a provider key that merely contains 'a' as a substring.
    const tokenLikes = filter.providers.map(() => `(',' || m.providersFlat || ',') LIKE ? ESCAPE '\\'`)
    clauses.push(`(${tokenLikes.join(' OR ')})`)
    bindValues.push(...filter.providers.map(provider => `,${provider},`))
  }

  const term = searchTerm.trim()
  if (term.length >= 3) {
    clauses.push(
      `(m.title LIKE ? ESCAPE '\\' OR m.artistName LIKE ? ESCAPE '\\' OR m.albumName LIKE ? ESCAPE '\\')`,
    )
    const pattern = `%${escapeLike(term)}%`
    bindValues.push(pattern, pattern, pattern)
  }

  return {
    where: clauses.join(' AND '),
    bindValues,
    genreJoin: filter.genres.length > 0,
  }
}

// ---------------------------------------------------------------------------
// Queries — all three share the clauses, so count/window/ids cannot drift
// ---------------------------------------------------------------------------

const idSchema = Schema.Array(Schema.Struct({ id: Schema.String }))

const countSchema = Schema.Array(Schema.Struct({ count: Schema.Number }))

const fromSql = (c: CollectionClauses): string =>
  c.genreJoin ? 'FROM media m INNER JOIN media_genres mg ON mg.mediaId = m.id' : 'FROM media m'

const whereSql = (c: CollectionClauses): string => (c.where.length > 0 ? ` WHERE ${c.where}` : '')

/**
 * Bounded snapshot of full rows, ordered deterministically by `(title, id)`.
 *
 * @param limit - window size; the caller refetches with a larger limit to
 * grow the window (results are a stable prefix, so growth never reorders).
 */
export const collectionWindowQuery = (c: CollectionClauses, limit: number) =>
  queryDb({
    query:
      `SELECT ${c.genreJoin ? 'DISTINCT ' : ''}${MEDIA_ROW_COLUMNS_SQL}` +
      ` ${fromSql(c)}${whereSql(c)} ORDER BY m.title ASC, m.id ASC LIMIT ${limit}`,
    bindValues: c.bindValues,
    schema: mediaRowSchema,
  })

/** Live count for the same clauses (DISTINCT when the genre join fans out). */
export const collectionCountQuery = (c: CollectionClauses) =>
  queryDb({
    query:
      `SELECT COUNT(${c.genreJoin ? 'DISTINCT ' : ''}m.id) AS count ${fromSql(c)}${whereSql(c)}`,
    bindValues: c.bindValues,
    schema: countSchema,
  })

/** All matching ids in window order — for one-shot whole-collection consumers. */
export const collectionAllIdsQuery = (c: CollectionClauses) =>
  queryDb({
    query:
      `SELECT ${c.genreJoin ? 'DISTINCT ' : ''}m.id AS id ${fromSql(c)}${whereSql(c)}` +
      ` ORDER BY m.title ASC, m.id ASC`,
    bindValues: c.bindValues,
    schema: idSchema,
  })
