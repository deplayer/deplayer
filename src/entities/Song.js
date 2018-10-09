// @flow

import uuidv4 from 'uuid'

type money = {
  price: number,
  currency: string
}

type streamUri = {
  uri: string,
  quality: string
}

type stream = {
  service: string,
  uris: Array<streamUri>
}

type cover = {
  thumbnailUrl: string,
  fullUrl: string
}

type album = {
  name: string
}

export default class Song {
  id: string
  title: string
  genre: string
  artist: {
    name: string
  }
  album: album
  cover: cover
  // In milliseconds
  duration: number
  price: money

  stream: Array<stream>

  constructor(songParams: any = {}) {
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
      stream
    } = songParams

    this.id = id ? id : uuidv4()
    this.title = title
    this.duration = duration
    this.genre = genre

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
