import Media from './Media'
import slugify from '@sindresorhus/slugify'

const zeroPad = (num: number | undefined, places: number) => String(num).padStart(places, '0')

export default class MediaId {
  id: string

  constructor(media: Media) {
    if (media.forcedId) {
      this.id = media.forcedId
    } else {
      this.id = media.artistName + '_' + media.albumName + '_' + zeroPad(media.track, 4) + '_' + media.title
    }
  }

  get value() {
    return slugify(this.id)
  }
}
