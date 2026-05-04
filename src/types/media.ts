export type Stream = {
  service: string
  uris: Array<{ uri: string }>
}

export type Cover = {
  thumbnailUrl: string
  fullUrl: string
}

export type MediaRow = {
  id: string
  title: string
  artistId: string
  albumId: string
  artistName: string
  albumName: string
  type: 'audio' | 'video'
  duration: number // always milliseconds
  playCount: number
  track: number | null
  discNumber: number | null
  stream: Record<string, Stream>
  cover: Cover | null
  genres: string[]
  externalId: string | null
  shareUrl: string | null
  filePath: string | null
  genresFlat: string
  providersFlat: string
}

export type ArtistRow = {
  id: string
  name: string
}

export type AlbumRow = {
  id: string
  name: string
  artistId: string
  thumbnailUrl: string | null
  year: number | null
}
