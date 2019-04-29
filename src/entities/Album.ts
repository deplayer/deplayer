import AlbumId from './AlbumId'

export default class Artist {
  id: string
  name: string

  constructor(albumParams: any = {}) {
    const { name } = albumParams
    this.name = name
    const albumId = new AlbumId({
      albumName: name
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
