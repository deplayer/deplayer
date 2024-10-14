import ArtistId from './ArtistId'

export type IArtist = {
  id?: string
  name: string
  artistId?: string
}

export default class Artist {
  id: string
  name: string

  constructor(artistParams: IArtist) {
    const { name, artistId } = artistParams
    this.name = name

    this.id = artistId ? artistId : new ArtistId({
      artistName: name
    }).value
  }

  toDocument(): any {
    return {
      id: '' + this.id,
      name: this.name
    }
  }
}
