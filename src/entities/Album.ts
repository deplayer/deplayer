import AlbumId from './AlbumId'
import Artist from './Artist'

interface AlbumParams {
  name: string
  artist: Artist
  albumId?: string
}

export default class Album {
  id: string
  name: string
  artist: Artist

  constructor(albumParams: AlbumParams) {
    const { name, artist, albumId } = albumParams
    this.name = name
    this.artist = artist

    const compAlbumId = albumId ? albumId : new AlbumId({
      albumName: name,
      artistName: artist.name
    }).value

    this.id = compAlbumId
  }

  // FIXME: Implement
  thumbnailUrl(): string {
    return ""
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
