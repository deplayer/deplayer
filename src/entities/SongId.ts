import Song from './Song'

export default class SongId {
  id: string

  constructor(song: Song) {
    if (song.forcedId) {
      this.id = song.forcedId
    } else {
      this.id = song.artistName + '-' + song.albumName + '-' + song.title
    }

    this.id = this.id.replace(/ /g, '-')
  }

  get value() {
    return this.id
  }
}
