import slugify from '@sindresorhus/slugify'

export default class AlbumId {
  id: string
  name: string

  constructor(props: {albumName: string}) {
    this.name = props.albumName ? props.albumName : 'undefined-album'
  }

  get value(): string {
    return slugify(this.name)
  }
}
