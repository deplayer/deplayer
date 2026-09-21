import { Schema } from '@livestore/livestore'

/**
 * Shared building blocks for raw LiveStore queries.
 *
 * Raw SQL is the only way to express a join, and LiveStore requires a decode
 * schema alongside it, so these helpers keep the column list and the schema
 * from drifting apart.
 */

/**
 * Sentinel id that matches no row.
 *
 * Queries are built eagerly, so a hook whose filter is absent still needs a
 * query to run. Comparing against this id returns nothing and keeps the hook
 * order stable.
 */
export const NO_MATCH_ID = '__NONE__'

/**
 * Canonical media column projection for raw SQL over `media`.
 *
 * Covers what both raw-query call sites read: the collection window rows and
 * the SongView genre list. It is the superset of the two, so collection rows
 * now carry `discNumber` and `playCount` where they previously did not.
 *
 * Deliberately module-private: call sites use the derived SQL and decode
 * schema below, so no one hand-builds a projection that can drift from them.
 */
const MEDIA_ROW_COLUMNS = [
  'id',
  'title',
  'track',
  'artistId',
  'artistName',
  'albumId',
  'albumName',
  'duration',
  'discNumber',
  'playCount',
  'cover',
  'stream',
  'type',
  'genresFlat',
  'providersFlat',
] as const

/** The projection above, qualified for a query aliasing `media` as `m`. */
export const MEDIA_ROW_COLUMNS_SQL = MEDIA_ROW_COLUMNS.map((col) => `m.${col}`).join(', ')

/**
 * Decode schema for {@link MEDIA_ROW_COLUMNS}. Only `id` is typed; every other
 * column passes through raw and is normalized by `rawToMediaRow`.
 */
export const mediaRowSchema = Schema.Array(
  Schema.Struct(
    Object.fromEntries(
      MEDIA_ROW_COLUMNS.map((col) => [col, col === 'id' ? Schema.String : Schema.Unknown])
    )
  )
)
