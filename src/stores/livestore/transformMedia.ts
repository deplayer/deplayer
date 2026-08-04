import type { MediaRow } from '../../types/media'

/**
 * Transform raw LiveStore media row into MediaRow with parsed JSON fields.
 * Pure function — no side effects, no LiveStore queries. This is the
 * cheap path used by hooks at reactive boundaries.
 * It parses JSON fields (stream, cover, genres) from raw SQLite rows.
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
    genres: parseJson(r.genres, []),
  } as unknown as MediaRow
}
