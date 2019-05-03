import ArtistId from './ArtistId'

export default class Artist {
  id: string
  name: string

  constructor(artistParams: any = {}) {
    const { name, artistId } = artistParams
    this.name = name

    this.id = artistId ? artistId : new ArtistId({
      artistName: name
    }).value
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
