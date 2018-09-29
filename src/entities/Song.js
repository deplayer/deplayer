// @flow

export default class Song {
  title: string
  artist: any

  constructor(songParams: any = {}) {
    const { title, artistName } = songParams
    this.title = title
    this.artist = {
      name: artistName
    }
  }
}
