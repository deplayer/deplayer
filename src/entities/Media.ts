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
  genres: string[]
  shareUrl?: string
  albumName: string
  filePath?: string
  forcedId?: string | null
  track?: number
  discNumber?: number
  year?: number
}

export const hasAnyProviderOf = (media: IMedia, checkProviders: Array<string>): boolean => {
  const providers = Object.values(media.stream).map((stream) => stream.service)

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
  genres: string[]
  year?: number
  shareUrl?: string
  albumName: string
  filePath?: string
  forcedId?: string | null
  track?: number
  discNumber?: number

  // DEBUG: Track constructor timing
  private static constructorCount = 0
  private static totalTime = 0
  
  constructor(songParams: IMedia) {
    const t0 = performance.now()
    
    this.title = songParams.title
    this.playCount = songParams.playCount ?? 0
    this.duration = songParams.duration ?? 0
    this.genres = songParams.genres || []
    this.shareUrl = songParams.shareUrl
    this.albumName = songParams.albumName
    this.filePath = songParams.filePath
    this.forcedId = songParams.forcedId
    this.type = songParams.type || 'audio'
    this.discNumber = songParams.discNumber

    const t1 = performance.now()

    // Ensure we have valid artist data
    const artistName = songParams.artistName || 'Unknown Artist'
    const artistId = songParams.artistId || undefined
    const artist = this.generateArtist(artistName, artistId)
    this.artist = artist
    this.artistName = artist.name

    const t2 = performance.now()

    // Ensure we have valid album data
    const albumProps: IAlbum = {
      ...songParams.album,
      thumbnailUrl: songParams.cover?.thumbnailUrl || songParams.album?.thumbnailUrl,
      // Only set these if they don't exist in album
      name: songParams.album?.name || songParams.albumName || 'Unknown Album',
      artist: songParams.album?.artist || { name: artistName, id: artistId }
    }
    this.album = new Album(albumProps)

    const t3 = performance.now()

    this.stream = songParams.stream || {}

    if (songParams.cover) {
      this.cover = {
        thumbnailUrl: songParams.cover?.thumbnailUrl,
        fullUrl: songParams.cover?.fullUrl
      }
    }

    this.track = songParams.track

    const t4 = performance.now()

    // this must be the last assignment
    const id = songParams.forcedId ? songParams.forcedId : new MediaId(this).value
    this.id = id
    this.externalId = id
    
    const t5 = performance.now()
    
    // Report timing every 100 items
    Media.constructorCount++
    Media.totalTime += (t5 - t0)
    if (Media.constructorCount % 100 === 0) {
      const avgTime = Media.totalTime / Media.constructorCount
      console.log(`[Media PERF] After ${Media.constructorCount} items: avg=${avgTime.toFixed(2)}ms/item`)
      console.log(`[Media PERF] Breakdown - props:${(t1-t0).toFixed(2)}, artist:${(t2-t1).toFixed(2)}, album:${(t3-t2).toFixed(2)}, stream:${(t4-t3).toFixed(2)}, id:${(t5-t4).toFixed(2)}`)
    }
  }

  generateArtist(artistName: string, artistId?: string): Artist {
    const artistPayload = {
      name: artistName || '',
      artistId: artistId ?? ''
    }

    return new Artist(artistPayload)
  }

  hasAnyProviderOf(checkProviders: Array<string>): boolean {
    return hasAnyProviderOf(this, checkProviders)
  }

  toDocument(): any {
    return {
      id: this.id,
      title: this.title,
      stream: this.stream,
      artist: this.artist.toDocument(),
      cover: this.cover,
      album: this.album.toDocument(),
      genres: this.genres,
      albumName: this.albumName,
      playCount: this.playCount,
      filePath: this.filePath,
      type: this.type,
      track: this.track,
      discNumber: this.discNumber,
      duration: this.duration
    }
  }

  toJSON() {
    return { ...this }
  }
}
