// @flow

import uuidv4 from 'uuid'

export default class Song {
  id: string
  title: string
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

  constructor(songParams: any = {}) {
    const {
      id,
      title,
      artistName,
      albumName,
      thumbnailUrl,
      duration
    } = songParams

    this.id = id ? id : uuidv4()
    this.title = title
    this.duration = duration

    this.album = {
      name: albumName
    }
    this.cover = {
      thumbnailUrl: thumbnailUrl
    }
    this.artist = {
      name: artistName
    }
  }
}
