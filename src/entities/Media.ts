import MediaId from './MediaId'
import Album from './Album'
import Artist from './Artist'

type streamUri = {
  uri: any,
  quality: string
}

type money = {
  price: number,
  currency: string
}

type stream = {
  service: string,
  uris: Array<streamUri>
}

type MediaType = 'video' | 'audio'

export default class Media {
  id: string
  title: string
  author: any
  cover: any
  artist: Artist
  album: Album
  artistName: string
  duration: number
  externalId: string
  stream: Array<stream>
  playCount: number
  genre: string
  forcedId: string
  shareUrl: string
  albumName: string
  price: money
  filePath: string

  constructor(songParams: any = {}) {
    const {
      cover,
      title,
      forcedId,
      artistName,
      artistId,
      albumId,
      albumName,
      duration,
      genre,
      price,
      currency,
      stream,
      playCount,
      shareUrl,
      filePath
    } = songParams

    this.title = title
    this.playCount = playCount
    this.duration = duration
    this.genre = genre
    this.shareUrl = shareUrl
    this.forcedId = forcedId
    this.albumName = albumName
    this.filePath = filePath

    const artist = this.generateArtist(artistName, artistId)
    this.artist = artist

    this.artistName = artist.name
    this.album = new Album({
      albumId: albumId,
      name: albumName ? albumName : '',
      artist: artist
    })
    if (typeof price === 'number') {
      this.price = {
        price: price || 0,
        currency: currency || 'USD'
      }
    } else {
      this.price = price
    }

    this.stream = stream || []
    this.cover = {
      thumbnailUrl: cover?.thumbnailUrl,
      fullUrl: cover?.fullUrl
    }

    // this must be the last assignment
    const id = forcedId ? forcedId : new MediaId(this).value
    this.id = id
    this.externalId = id
  }

  generateArtist(artistName: string, artistId: string): Artist {
    const artistPayload = {
      name: artistName ? artistName : '',
      artistId: artistId
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
