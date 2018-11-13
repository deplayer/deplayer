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
        type: 'string'
      },
      title: {
        type: 'string'
      },
    }
  }

  toDocument(): any {
    return {
      id: this.id,
      title: this.title
    }
  }
}
