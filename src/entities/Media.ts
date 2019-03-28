import MediaId from './MediaId'

type streamUri = {
  uri: string,
  quality: string
}

type stream = {
  service: string,
  uris: Array<streamUri>
}

export default class Media {
  id: string
  title: string
  duration: number
  artistName: string
  externalId: string
  artist: {
    name: string
  }
  stream: Array<stream>

  constructor(mediaParams: any = {}) {
    const {
      artistName,
      title,
      id
    } = mediaParams

    this.title = title
    this.externalId = id
    this.id = new MediaId(this).value

    this.artist = {
      name: artistName ? artistName : ''
    }
    this.artistName = this.artist.name
  }

  static toSchema(): any {
    return {
      id: {
        type: 'string'
      },
      title: {
        type: 'string'
      },
      duration: {
        type: 'number'
      },
      genre: {
        type: 'string'
      },
      shareUrl: {
        type: 'string'
      },
      album: {
        type: 'object',
        properties: {
          name: {
            type: 'string'
          },
        }
      },
      cover: {
        type: 'object',
        properties: {
          thumbnailUrl: {
            type: 'string'
          },
          fullUrl: {
            type: 'string'
          },
        }
      },
      artist: {
        type: 'object',
        properties: {
          name: {
            type: 'string'
          },
        }
      },
      stream: {
        type: 'array'
      },
    }
  }

  toDocument(): any {
    return {
      id: '' + this.id,
      title: this.title,
      artist: this.artist,
      stream: this.stream,
      duration: this.duration
    }
  }
}
