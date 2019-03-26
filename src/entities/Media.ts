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

    this.artist = {
      name: artistName
    }
    this.artistName = artistName
  }

  get id() {
    return new MediaId(this).value
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
