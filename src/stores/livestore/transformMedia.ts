import type { MediaRow } from '../../types/media'

/**
 * Transform raw LiveStore media row into MediaRow with nested artist/album
 * and parsed JSON fields. Pure function — no side effects, no LiveStore queries.
 */
export function transformMediaRow(raw: Record<string, unknown> | null | undefined): MediaRow | null {
  if (!raw) return null

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

  // Reconstruct nested artist object from flat fields
  const artist = {
    id: (raw.artistId as string) || '',
    name: (raw.artistName as string) || 'Unknown Artist',
  }

  const cover = parseJson(raw.cover, null) as { thumbnailUrl?: string; fullUrl?: string } | null

  // Reconstruct nested album object from flat fields
  const album = {
    id: (raw.albumId as string) || '',
    name: (raw.albumName as string) || 'Unknown Album',
    artistId: (raw.artistId as string) || '',
    artist,
    thumbnailUrl: cover?.thumbnailUrl || null,
    year: raw.year || null,
  }

  return {
    ...raw,
    stream: parseJson(raw.stream, {}),
    cover,
    genres: parseJson(raw.genres, []),
    artist,
    album,
  } as unknown as MediaRow
}
