import axios from 'axios'

import Media, { IMedia } from '../entities/Media'
import { IMusicProvider } from './IMusicProvider'

/**
 * Implement the Subsonic API
 */
export default class SubsonicApiProvider implements IMusicProvider {
  baseUrl: string
  user: string
  password: string
  albumSongsUrl: string
  searchUrl: string
  streamBase: string
  coverBase: string
  providerKey: string

  constructor(settings: any, providerKey: string) {
    const appName = 'deplayer'
    const songCount = 1000
    const artistCount = 1000
    this.baseUrl = settings.baseUrl
    this.user = settings.user
    this.password = settings.password
    this.providerKey = providerKey
    this.albumSongsUrl = `${settings.baseUrl}/rest/getMusicFolders.view?u=${settings.user}&p=${settings.password}&c=${appName}&v=1.11.0&f=json`
    this.searchUrl = `${settings.baseUrl}/rest/search3.view?songCount=${songCount}&artistCount=${artistCount}&u=${settings.user}&p=${settings.password}&c=${appName}&v=1.11.0&f=json`
    this.streamBase = `${settings.baseUrl}/rest/stream.view?u=${settings.user}&p=${settings.password}&c=${appName}&v=1.11.0&f=json`
    this.coverBase = `${settings.baseUrl}/rest/getCoverArt.view?u=${settings.user}&p=${settings.password}&c=${appName}&v=1.11.0&f=json`
  }

  mapSongs = (songs: IMedia[], albums: any[] = []): Array<any> => {
    // Protect against empty responses
    if (!songs) {
      return []
    }

    const secureSongs = songs instanceof Array ? songs : [songs]
    return secureSongs.map((song: any) => {
      const album = albums.find((album) => album.id === song.album.id)

      return new Media({
        title: song.title ? song.title : song.path,
        artist: { name: song.artist },
        artistName: song.artist,
        album: { name: song.album, artist: { name: song.artist } },
        year: album?.year,
        albumName: song.album,
        cover: {
          thumbnailUrl: this.coverBase + '&id=' + song.coverArt,
          fullUrl: this.coverBase + '&id=' + song.coverArt,
        },
        genres: song.genres.map((genre: { name: string }) => genre.name),
        duration: song.duration * 1000,
        track: song.track,
        filePath: song.path,
        type: 'audio',
        stream: {
          subsonic: {
            service: this.providerKey,
            uris: [{ uri: this.streamBase + '&id=' + song.id }]
          }
        },
      })
    })
  }

  search(searchTerm: string): Promise<Array<IMedia>> {
    return new Promise((resolve, reject) => {
      axios.get(`${this.searchUrl}&query=${searchTerm}`)
        .then((result) => {
          const songs = result.data['subsonic-response'].searchResult3 ? result.data['subsonic-response'].searchResult3.song : []
          const albums = result.data['subsonic-response'].searchResult3 ? result.data['subsonic-response'].searchResult3.album : []
          resolve(
            this.mapSongs(songs, albums)
          )
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  async fullSync(): Promise<Array<any>> {
    try {
      const result = await axios.get(`${this.baseUrl}/rest/getAlbumList2.view?u=${this.user}&p=${this.password}&c=deplayer&v=1.11.0&f=json&type=alphabeticalByName`)
      const albums = result.data['subsonic-response'].albumList2.album
      
      const allSongs = []
      
      for (const album of albums) {
        const albumDetails = await axios.get(`${this.baseUrl}/rest/getAlbum.view?u=${this.user}&p=${this.password}&c=deplayer&v=1.11.0&f=json&id=${album.id}`)
        const songs = albumDetails.data['subsonic-response'].album.song
        allSongs.push(...this.mapSongs(songs, [album]))
      }
      
      return allSongs
    } catch (error) {
      console.error('Error during full sync:', error)
      throw error
    }
  }
}
