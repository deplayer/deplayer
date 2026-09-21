import type { MediaRow } from '../../types/media'

/**
 * Transform raw LiveStore media row into MediaRow with parsed JSON fields.
 * Pure function — no side effects, no LiveStore queries. This is the
 * cheap path used by hooks at reactive boundaries.
 * It parses the JSON columns (stream, cover) from raw SQLite rows and
 * derives the display genre list from the comma-joined `genresFlat` column
 * (`media_genres` holds the exact per-genre membership).
 */
export function rawToMediaRow(raw: unknown): MediaRow | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>

  // Parse JSON fields if they're strings
  const parseJson = (val: unknown, defaultVal: unknown = {}) => {
    if (!val) return defaultVal
    if (typeof val === 'object') return val
    if (typeof val === 'string') {
      try {
        return JSON.parse(val)
      } catch {
        return defaultVal
      }
    }
    return defaultVal
  }

  return {
    ...r,
    stream: parseJson(r.stream, {}),
    cover: parseJson(r.cover, null) as MediaRow['cover'],
    genres: parseGenres(r.genresFlat),
  } as unknown as MediaRow
}

/** Display genres derived from the comma-joined `genresFlat` column. */
const parseGenres = (val: unknown): string[] => {
  if (typeof val !== 'string' || val.length === 0) return []
  return val
    .split(',')
    .map((genre) => genre.trim())
    .filter((genre) => genre.length > 0)
}
