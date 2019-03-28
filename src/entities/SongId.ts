import Song from './Song'
import slugify from '@sindresorhus/slugify'

export default class SongId {
  id: string

  constructor(song: Song) {
    if (song.forcedId) {
      this.id = song.forcedId
    } else {
      this.id = song.artistName + '_' + song.albumName + '_' + song.title
    }

    this.id = slugify(this.id)
  }

  get value() {
    return this.id
  }
}
