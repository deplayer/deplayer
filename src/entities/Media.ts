import MediaId from './MediaId'
import Album, { IAlbum } from './Album'
import Artist, { IArtist } from './Artist'

type streamUri = {
  uri: string
}

export interface Stream {
  service: string,
  uris: Array<streamUri>
}

export interface Cover {
  thumbnailUrl: string,
  fullUrl: string
}

export interface IMedia {
  id?: string
  title: string
  cover?: Cover
  artist: IArtist
  album: IAlbum
  artistName: string
  artistId?: string
  type: 'audio' | 'video'
  duration?: number
  externalId?: string
  stream: { [key: string]: Stream }
  playCount?: number
  genre?: string
  shareUrl?: string
  albumName: string
  filePath?: string
  forcedId?: string | null
  track?: number
  year?: number
}

export default class Media implements IMedia {
  id: string
  title: string
  cover?: Cover
  artist: Artist
  album: Album
  artistName: string
  type: 'audio' | 'video'
  duration: number
  externalId: string
  stream: { [key: string]: Stream }
  playCount: number
  genre?: string
  year?: number
  shareUrl?: string
  albumName: string
  filePath?: string
  forcedId?: string | null
  track?: number

  constructor(songParams: IMedia) {
    this.title = songParams.title
    this.playCount = songParams.playCount ?? 0
    this.duration = songParams.duration ?? 0
    this.genre = songParams.genre
    this.shareUrl = songParams.shareUrl
    this.albumName = songParams.albumName
    this.filePath = songParams.filePath
    this.forcedId = songParams.forcedId
    this.type = songParams.type

    const artist = this.generateArtist(songParams.artistName, songParams.artistId)
    this.artist = artist

    this.artistName = artist.name
    const albumProps = { ...songParams.album, thumbnailUrl: songParams.cover?.thumbnailUrl }
    this.album = new Album(albumProps)

    this.stream = songParams.stream || {}

    if (songParams.cover) {
      this.cover = {
        thumbnailUrl: songParams.cover?.thumbnailUrl,
        fullUrl: songParams.cover?.fullUrl
      }
    }

    this.track = songParams.track

    // this must be the last assignment
    const id = songParams.forcedId ? songParams.forcedId : new MediaId(this).value
    this.id = id
    this.externalId = id
  }

  generateArtist(artistName: string, artistId?: string): Artist {
    const artistPayload = {
      name: artistName || '',
      artistId: artistId ?? ''
    }

    return new Artist(artistPayload)
  }

  hasAnyProviderOf(checkProviders: Array<string>): boolean {
    const providers = Object.values(this.stream).map((stream) => stream.service)

    let result = false

    providers.forEach((prov) => {
      checkProviders.forEach((checkProv: string) => {
        if (prov.startsWith(checkProv)) {
          result = true
        }
      })
    })

    return result
  }

  get genres(): Array<string> {
    return this.genre ? this.genre.split(',') : []
  }

  toDocument(): any {
    return {
      id: this.id,
      title: this.title,
      stream: this.stream,
      artist: this.artist.toDocument(),
      cover: this.cover,
      album: this.album.toDocument(),
      genre: this.genre,
      albumName: this.albumName,
      playCount: this.playCount,
      filePath: this.filePath,
      type: this.type,
      track: this.track,
      duration: this.duration
    }
  }

  toJSON() {
    return { ...this }
  }
}
