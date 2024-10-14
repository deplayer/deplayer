import AlbumId from './AlbumId'
import Artist, { IArtist } from './Artist'

export interface IAlbum {
  id?: string
  name: string
  artist: IArtist
  albumId?: string
  thumbnailUrl?: string
  year?: number
}

export default class Album {
  id: string
  name: string
  artist: Artist
  thumbnailUrl: string
  year?: number

  constructor(albumParams: IAlbum) {
    const { name, artist, albumId, thumbnailUrl, year } = albumParams
    this.name = name
    this.artist = new Artist(artist)
    this.thumbnailUrl = thumbnailUrl || ''
    this.year = year

    const compAlbumId = albumId ? albumId : new AlbumId({
      albumName: name,
      artistName: artist.name
    }).value

    this.id = compAlbumId
  }

  toDocument(): IAlbum {
    return {
      id: '' + this.id,
      name: this.name,
      artist: this.artist.toDocument(),
      thumbnailUrl: this.thumbnailUrl,
      year: this.year
    }
  }
}
