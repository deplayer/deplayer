import Media from './Media'
import slugify from '@sindresorhus/slugify'

export default class MediaId {
  id: string

  constructor(media: Media) {
    if (media.forcedId) {
      this.id = media.forcedId
    } else {
      this.id = media.artistName + '_' + media.albumName + '_' + media.title
    }
  }

  get value() {
    return slugify(this.id)
  }
}
