import AlbumId from './AlbumId'
import Artist from './Artist'

interface AlbumParams {
  name: string
  artist: Artist
  albumId?: string
  thumbnailUrl?: string
}

export default class Album {
  id: string
  name: string
  artist: Artist
  thumbnailUrl: string

  constructor(albumParams: AlbumParams) {
    const { name, artist, albumId, thumbnailUrl } = albumParams
    this.name = name
    this.artist = artist
    this.thumbnailUrl = thumbnailUrl || ''

    const compAlbumId = albumId ? albumId : new AlbumId({
      albumName: name,
      artistName: artist.name
    }).value

    this.id = compAlbumId
  }

  toDocument(): any {
    return {
      id: '' + this.id,
      name: this.name,
      artist: this.artist.toDocument(),
      thumbnailUrl: this.thumbnailUrl
    }
  }
}
