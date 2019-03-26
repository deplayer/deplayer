import * as uuidv4 from 'uuid'

import Media from './Media'

export default class MediaId {
  id: string

  constructor(media: Media) {
    this.id = media.externalId ? media.externalId : uuidv4()
  }

  get value() {
    return this.id
  }
}
