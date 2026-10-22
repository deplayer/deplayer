import type { MediaRow } from '../../types/media'
import { parseGenresCsv } from '../../utils/genres'

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
    genres: parseGenresCsv(r.genresFlat),
  } as MediaRow
}
