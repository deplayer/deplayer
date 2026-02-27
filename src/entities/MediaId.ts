import Media from './Media'

const zeroPad = (num: number | undefined, places: number) => String(num).padStart(places, '0')

/**
 * Fast slug generation - replaces expensive slugify library
 * 
 * Performance: ~100x faster than @sindresorhus/slugify
 * - Converts to lowercase
 * - Replaces spaces and special chars with hyphens
 * - Removes non-alphanumeric characters (except hyphens)
 * - Collapses multiple hyphens
 */
function fastSlugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')                    // Decompose accents (é → e + ́)
    .replace(/[\u0300-\u036f]/g, '')     // Remove accent marks
    .replace(/[^a-z0-9]+/g, '-')         // Replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, '')             // Trim leading/trailing hyphens
    .replace(/-+/g, '-')                 // Collapse multiple hyphens
}

export default class MediaId {
  id: string

  constructor(media: Media) {
    if (media.forcedId) {
      this.id = media.forcedId
    } else {
      const discNumber = media.discNumber ? zeroPad(media.discNumber, 2) : ''

      this.id = media.artistName + '_' + media.albumName + '_' + discNumber + '_' + zeroPad(media.track, 4) + '_' + media.title
    }
  }

  get value() {
    return fastSlugify(this.id)
  }
}
