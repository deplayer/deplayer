import type { MediaRow, Cover, Stream } from '../types/media'
import { generateMediaId, generateArtistId, generateAlbumId } from './generateIds'

export type DurationInput =
  | { value: number; unit: 'ms' }
  | { value: number; unit: 'seconds' }
  | { value: number; unit: 'ticks' }
  | number // treated as ms for backwards compat

export type RawMediaInput = {
  title?: string
  artistName?: string
  albumName?: string
  type?: 'audio' | 'video'
  duration?: DurationInput
  track?: number | null
  discNumber?: number | null
  stream?: Record<string, Stream>
  cover?: Cover | null
  genres?: string[] | string
  externalId?: string | null
  shareUrl?: string | null
  filePath?: string | null
  forcedId?: string | null
  year?: number | null
}

export type NormalizedMedia = {
  media: MediaRow
  artist: { id: string; name: string }
  album: { id: string; name: string; artistId: string; thumbnailUrl: string | null; year: number | null }
}

function normalizeDuration(input?: DurationInput): number {
  if (input == null) return 0
  if (typeof input === 'number') return input
  switch (input.unit) {
    case 'ms': return input.value
    case 'seconds': return input.value * 1000
    case 'ticks': return Math.floor(input.value / 10000)
  }
}

function normalizeGenres(input?: string[] | string): string[] {
  if (!input) return []
  if (typeof input === 'string') return input ? [input] : []
  return input.filter(g => g !== '')
}

export function normalizeMedia(raw: RawMediaInput): NormalizedMedia {
  const artistName = raw.artistName || 'Unknown Artist'
  const albumName = raw.albumName || 'Unknown Album'
  const title = raw.title || 'Untitled'
  const stream = raw.stream || {}
  const genres = normalizeGenres(raw.genres)

  const artistId = generateArtistId(artistName)
  const albumId = generateAlbumId(albumName, artistName)
  const mediaId = generateMediaId({
    title,
    artistName,
    albumName,
    track: raw.track,
    forcedId: raw.forcedId
  })

  const media: MediaRow = {
    id: mediaId,
    title,
    artistId,
    albumId,
    artistName,
    albumName,
    type: raw.type || 'audio',
    duration: normalizeDuration(raw.duration),
    playCount: 0,
    track: raw.track ?? null,
    discNumber: raw.discNumber ?? null,
    stream,
    cover: raw.cover || null,
    genres,
    externalId: raw.externalId ?? null,
    shareUrl: raw.shareUrl ?? null,
    filePath: raw.filePath ?? null,
    genresFlat: genres.join(','),
    providersFlat: Object.keys(stream).join(',')
  }

  return {
    media,
    artist: { id: artistId, name: artistName },
    album: {
      id: albumId,
      name: albumName,
      artistId,
      thumbnailUrl: raw.cover?.thumbnailUrl || null,
      year: raw.year ?? null
    }
  }
}
