import Media from './Media'
import SongId from './SongId'
import Artist from './Artist'
import Album from './Album'

type money = {
  price: number,
  currency: string
}

export default class Song extends Media {
  id: string
  forcedId: string
  genre: string
  shareUrl: string
  album: Album
  albumName: string
  duration: number // In milliseconds
  price: money
  dateAdded: Date
  artistName: string
  cover: any
  artist: Artist
  filePath: string

  constructor(songParams: any = {}) {
    super(songParams)

    const {
      cover,
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
      shareUrl,
      filePath
    } = songParams

    this.setArtist(artistName, artistId)

    this.artistName = this.artist.name

    this.duration = duration
    this.genre = genre
    this.shareUrl = shareUrl
    this.forcedId = forcedId
    this.albumName = albumName
    this.filePath = filePath

    this.album = new Album({
      albumId: albumId,
      name: albumName ? albumName : '',
      artist: this.artist
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
    this.cover = cover ? {
      thumbnailUrl: cover.thumbnailUrl,
      fullUrl: cover.fullUrl
    } : {}

    // this must be the last assignment
    const id = forcedId ? forcedId : new SongId(this).value
    this.id = id
    this.externalId = id
  }

  setArtist(artistName: string, artistId: string) {
    const artistPayload = {
      name: artistName ? artistName : ''
    }

    if (artistId) {
      artistPayload['artistId'] = artistId
    }

    this.artist = new Artist(artistPayload)
  }

  hasAnyProviderOf(checkProviders: Array<string>): boolean {
    const providers = this.stream.map((stream) => stream.service)

    let result = false

    providers.forEach((prov) => {
      if (checkProviders.indexOf(prov) !== -1) {
        result = true
      }
    })

    return result
  }

  toDocument(): any {
    return {
      id: this.id,
      title: this.title,
      stream: this.stream,
      artist: this.artist,
      cover: this.cover,
      album: this.album,
      genre: this.genre,
      filePath: this.filePath,
      duration: this.duration,
    }
  }
}
