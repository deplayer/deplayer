// @flow

import uuidv4 from 'uuid'

export default class Song {
  id: string
  title: string
  artist: any

  constructor(songParams: any = {}) {
    const { id, title, artistName } = songParams

    this.id = id ? id : uuidv4()

    this.title = title
    this.artist = {
      name: artistName
    }
  }
}
