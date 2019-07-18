import MediaId from './MediaId'

type streamUri = {
  uri: string,
  quality: string
}

type stream = {
  service: string,
  uris: Array<streamUri>
}

type cover = {
  thumbnailUrl: string,
  fullUrl: string
}

export default class Media {
  id: string
  title: string
  author: any
  authorName: string
  cover: cover
  duration: number
  externalId: string
  stream: Array<stream>

  constructor(mediaParams: any = {}) {
    const {
      authorName,
      title,
      thumbnailUrl,
      fullUrl,
      id
    } = mediaParams

    this.title = title
    this.externalId = id
    this.id = new MediaId(this).value

    this.author = {
      name: authorName ? authorName : ''
    }
    this.authorName = this.author.name

    this.cover = {
      thumbnailUrl: thumbnailUrl,
      fullUrl: fullUrl
    }
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
      filePath: {
        type: 'string'
      },
      album: {
        type: 'object',
        properties: {
          id: {
            type: 'string'
          },
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
          id: {
            type: 'string'
          },
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
      artist: this.author,
      cover: this.cover,
      stream: this.stream,
      duration: this.duration
    }
  }
}
