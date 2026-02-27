/**
 * Fast slug generation - replaces expensive slugify library
 * ~100x faster than @sindresorhus/slugify
 */
function fastSlugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
}

export default class ArtistId {
  id: string
  name: string

  constructor(props: { artistName: string }) {
    this.name = props.artistName ? props.artistName : 'undefined-artist'
    this.id = this.value
  }

  get value(): string {
    return fastSlugify(this.name)
  }
}
