// @flow

import uuidv4 from 'uuid'
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
  id: string
  title: string
  genre: string
  shareUrl: string
  artist: {
    name: string
  }
  album: album
  cover: cover
  // In milliseconds
  duration: number
  price: money
  dateAdded: Date

  constructor(songParams: any = {}) {
    super()

    const {
      id,
      title,
      artistName,
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

    this.id = id ? id : uuidv4()
    this.title = title
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
    this.artist = {
      name: artistName
    }
    this.price = {
      price: price || 0,
      currency: currency || 'USD'
    }
    this.stream = stream || []
  }
}
