import slugify from '@sindresorhus/slugify'

export default class AlbumId {
  id: string
  name: string
  artistName: string

  constructor(props: { albumName: string, artistName: string }) {
    this.name = props.albumName ? props.albumName : 'undefined-album'
    this.artistName = props.artistName ? props.artistName : 'undefined-artist'

    this.id = this.value
  }

  get value(): string {
    return slugify(this.artistName + '-' + this.name)
  }
}
