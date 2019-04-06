import Media from './Media'

export default class MediaId {
  id: string

  constructor(media: Media) {
    this.id = media.externalId
  }

  get value() {
    return this.id
  }
}
