import AlbumId from './AlbumId'
import Artist from './Artist'

export default class Album {
  id: string
  name: string
  artist: Artist

  constructor(albumParams: any = {}) {
    const { name, artist } = albumParams
    this.name = name
    this.artist = artist

    const albumId = new AlbumId({
      albumName: name,
      artistName: artist.name
    })
    this.id = albumId.value
  }

  static toSchema(): any {
    return {
      id: {
        type: 'string'
      },
      name: {
        type: 'string'
      }
    }
  }

  toDocument(): any {
    return {
      id: '' + this.id,
      name: this.name
    }
  }
}
