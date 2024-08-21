import MediaId from './MediaId'
import Album from './Album'
import Artist from './Artist'

type streamUri = {
  uri: string
}

export type Stream = {
  service: string,
  uris: Array<streamUri>
}

type MediaType = 'video' | 'audio'

export type Cover = {
  thumbnailUrl: string,
  fullUrl: string
}

interface MediaParams {
  title: string
  artistName: string
  artistId?: string
  albumId?: string
  albumName: string
  duration?: number
  genre?: string
  cover?: Cover
  stream: Array<Stream>
  playCount?: number
  shareUrl?: string
  filePath?: string
  forcedId?: string | null
  type?: string
  track?: number
  year?: number
}

export default class Media {
  id: string
  title: string
  cover?: Cover
  artist: Artist
  album: Album
  artistName: string
  type?: string
  duration: number
  externalId: string
  stream: Array<Stream>
  playCount: number
  genre?: string
  shareUrl?: string
  albumName: string
  filePath?: string
  forcedId?: string | null
  track?: number

  constructor(songParams: MediaParams) {
    this.title = songParams.title
    this.playCount = songParams.playCount ?? 0
    this.duration = songParams.duration ?? 0
    this.genre = songParams.genre
    this.shareUrl = songParams.shareUrl
    this.albumName = songParams.albumName
    this.filePath = songParams.filePath
    this.forcedId = songParams.forcedId

    const artist = this.generateArtist(songParams.artistName, songParams.artistId)
    this.artist = artist

    this.artistName = artist.name
    this.album = new Album({
      albumId: songParams.albumId,
      name: songParams.albumName || '',
      artist: artist,
      thumbnailUrl: songParams.cover?.thumbnailUrl,
      year: songParams.year
    })

    this.stream = songParams.stream || []

    if (songParams.cover) {
      this.cover = {
        thumbnailUrl: songParams.cover?.thumbnailUrl,
        fullUrl: songParams.cover?.fullUrl
      }
    }

    // this must be the last assignment
    const id = songParams.forcedId ? songParams.forcedId : new MediaId(this).value
    this.id = id
    this.externalId = id

    this.track = songParams.track
  }

  generateArtist(artistName: string, artistId?: string): Artist {
    const artistPayload = {
      name: artistName || '',
      artistId: artistId ?? ''
    }

    return new Artist(artistPayload)
  }

  hasAnyProviderOf(checkProviders: Array<string>): boolean {
    const providers = this.stream.map((stream) => stream.service)

    let result = false

    providers.forEach((prov) => {
      checkProviders.forEach((checkProv: string) => {
        if (prov.startsWith(checkProv)) {
          result = true
        }
      })
    })

    return result
  }

  get media_type(): MediaType {
    const uris: Array<string> = []
    this.stream.forEach((stream) => stream.uris.forEach((uri) => uris.push(uri.uri)))

    if (uris.filter((uri) => uri.endsWith('.mp4')).length) {
      return 'video'
    }

    if (this.hasAnyProviderOf(['youtube', 'webtorrent'])) {
      return 'video'
    }

    return 'audio'
  }

  get genres(): Array<string> {
    return this.genre ? this.genre.split(',') : []
  }

  toDocument(): any {
    return {
      id: this.id,
      title: this.title,
      stream: this.stream,
      artist: this.artist.toDocument(),
      cover: this.cover,
      album: this.album.toDocument(),
      genre: this.genre,
      albumName: this.albumName,
      playCount: this.playCount,
      filePath: this.filePath,
      media_type: this.media_type,
      duration: this.duration
    }
  }

  toJSON() {
    return { ...this, media_type: this.media_type }
  }
}
