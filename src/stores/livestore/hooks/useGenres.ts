import { useAppStore } from '../store'
import { queryDb, Schema } from '@livestore/livestore'
import { tables } from '../schema'
import { MEDIA_ROW_COLUMNS_SQL, mediaRowSchema, NO_MATCH_ID } from '../query'
import { useMemo } from 'react'
import type { MediaRow } from '../../../types/media'
import { rawToMediaRow } from '../transformMedia'

/**
 * Returns a map of genre -> song IDs
 * Matches the Redux collection.songsByGenre structure
 */
export const useSongsByGenre = (): Record<string, string[]> => {
  const store = useAppStore()
  const rows = store.useQuery(
    queryDb(
      tables.mediaGenres
        .select('mediaId', 'genre')
        .orderBy('genre', 'asc')
    )
  )

  return useMemo(() => {
    const songsByGenre: Record<string, string[]> = {}
    if (!Array.isArray(rows)) return songsByGenre

    for (const row of rows) {
      const mediaId = typeof row.mediaId === 'string' ? row.mediaId : ''
      const genre = typeof row.genre === 'string' ? row.genre.trim() : ''
      if (!mediaId || !genre) continue
      if (!songsByGenre[genre]) songsByGenre[genre] = []
      songsByGenre[genre].push(mediaId)
    }

    return songsByGenre
  }, [rows])
}

/**
 * Returns an array of all unique genres with their counts
 * Sorted by count descending
 */
const genreCountsQuery = queryDb({
  query: `
    SELECT genre AS name, COUNT(*) AS count
    FROM media_genres
    GROUP BY genre
    ORDER BY count DESC, name ASC
  `,
  schema: Schema.Array(Schema.Struct({
    name: Schema.String,
    count: Schema.Number,
  })),
})

export const useGenres = (): Array<{ name: string; count: number }> => {
  const store = useAppStore()
  const rows = store.useQuery(genreCountsQuery)

  return useMemo(() => {
    if (!Array.isArray(rows)) return []
    return rows.flatMap((row) => {
      if (typeof row !== 'object' || !row) return []
      const name = typeof row.name === 'string' ? row.name.trim() : ''
      let count: number | undefined
      if ('count' in row && typeof row.count === 'number') count = row.count
      else if ('count' in row) count = Number(row.count as unknown)
      if (!name || !Number.isFinite(count!) || count! <= 0) return []
      return [{ name, count: count! }]
    })
  }, [rows])
}

/**
 * Songs in a genre, matched EXACTLY through the indexed `media_genres` join —
 * the same semantics the collection filter uses. The previous
 * `genresFlat LIKE '%genre%'` match was a substring match, so "Rock" also
 * pulled in "Rockabilly", "Classic Rock" and "Punk Rock".
 */
const mediaByGenreQuery = (genre: string, limit: number) =>
  queryDb({
    query: `
      SELECT ${MEDIA_ROW_COLUMNS_SQL}
      FROM media m
      INNER JOIN media_genres mg ON mg.mediaId = m.id
      WHERE mg.genre = ?
      ORDER BY m.id
      LIMIT ?
    `,
    schema: mediaRowSchema,
    bindValues: [genre, limit],
  })

/**
 * Get media items for a specific genre
 * PERF: Only loads songs matching the genre (not entire library)
 *
 * @param genre - Genre name to filter by (optional)
 * @param limit - Max number of results (default 25)
 * @returns Array of media rows matching the genre
 */
export const useMediaByGenre = (genre: string | undefined | null, limit = 25): MediaRow[] => {
  const store = useAppStore()
  const rows = store.useQuery(
    genre
      ? mediaByGenreQuery(genre, limit)
      : queryDb(tables.media.select().where('id', '=', NO_MATCH_ID))
  )

  return useMemo(() => {
    if (!Array.isArray(rows)) return []
    return rows.flatMap((row) => {
      const media = rawToMediaRow(row)
      return media ? [media] : []
    })
  }, [rows])
}
