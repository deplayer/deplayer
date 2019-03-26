import Media from './Media'
import SongId from './SongId'

type money = {
  price: number,
  currency: string
}

type cover = {
  thumbnailUrl: string,
  fullUrl: string
}

type album = {
  name: string
}

export default class Song extends Media {
  forcedId: string
  genre: string
  shareUrl: string
  album: album
  albumName: string
  cover: cover
  // In milliseconds
  duration: number
  price: money
  dateAdded: Date

  constructor(songParams: any = {}) {
    super(songParams)

    const {
      forcedId,
      albumName,
      thumbnailUrl,
      fullUrl,
      duration,
      genre,
      price,
      currency,
      stream,
      shareUrl
    } = songParams

    this.duration = duration
    this.genre = genre
    this.shareUrl = shareUrl
    this.forcedId = forcedId

    this.album = {
      name: albumName
    } || {}
    this.albumName = albumName
    this.cover = {
      thumbnailUrl: thumbnailUrl,
      fullUrl: fullUrl
    }
    if (typeof price === 'number') {
      this.price = {
        price: price || 0,
        currency: currency || 'USD'
      }
    } else {
      this.price = price
    }

    this.stream = stream || []
  }

  get id() {
    return new SongId(this).value
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
      duration: this.duration,
    }
  }
}
