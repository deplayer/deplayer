// @flow

import uuidv4 from 'uuid'

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
  stream: Array<stream>

  constructor(mediaParams: any = {}) {
    const { id, title } = mediaParams
    this.id = id ? id : uuidv4()
    this.title = title
  }

  static toSchema(): any {
    return {
      id: {
        type: 'string',
        primary: true
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
        type: 'object'
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
      stream: this.stream
    }
  }
}
