import slugify from '@sindresorhus/slugify'

export default class ArtistId {
  id: string
  name: string

  constructor(props: {artistName: string}) {
    this.name = props.artistName ? props.artistName : 'undefined-artist'
  }

  get value(): string {
    return slugify(this.name)
  }
}
