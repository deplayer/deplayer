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

export default class Song {
  id: string
  title: string
  genre: string
  artist: {
    name: string
  }
  album: {
    name: string
  }
  cover: {
    thumbnailUrl: string
  }
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
    }
    this.cover = {
      thumbnailUrl: thumbnailUrl
    }
    this.artist = {
      name: artistName
    }
    this.price = {
      price: price,
      currency: currency || 'USD'
    }
    this.stream = stream || []
  }
}
