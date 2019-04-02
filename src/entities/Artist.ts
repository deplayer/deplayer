import ArtistId from './ArtistId'

export default class Artist {
  id: string
  name: string

  constructor(artistParams: any = {}) {
    const { name } = artistParams
    this.name = name
    const artistId = new ArtistId({
      artistName: name
    })
    this.id = artistId.value
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
