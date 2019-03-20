import Media from './Media'

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
  genre: string
  shareUrl: string
  album: album
  cover: cover
  // In milliseconds
  duration: number
  price: money
  dateAdded: Date

  constructor(songParams: any = {}) {
    super(songParams)

    const {
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

    this.album = {
      name: albumName
    } || {}
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
