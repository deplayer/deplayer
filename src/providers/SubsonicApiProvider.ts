import axios from 'axios'

import Media from '../entities/Media'
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

  mapSongs = (songs: Array<any>): Array<any> => {
    // Protect against empty responses
    if (!songs) {
      return []
    }

    const secureSongs = songs instanceof Array ? songs : [songs]
    return secureSongs.map((song: any) => {
      return new Media({
        title: song.title ? song.title : song.path,
        artistName: song.artist,
        albumName: song.album,
        cover: {
          thumbnailUrl: this.coverBase + '&id=' + song.coverArt,
          fullUrl: this.coverBase + '&id=' + song.coverArt,
        },
        genre: song.genre,
        duration: song.duration * 1000,
        track: song.track,
        filePath: song.path,
        stream: [
          {
            service: this.providerKey,
            uris: [{uri: this.streamBase + '&id=' + song.id}]
          }
        ]
      })
    })
  }

  search(searchTerm: string): Promise<Array<any>> {
    return new Promise((resolve, reject) => {
      axios.get(`${this.searchUrl}&query=${searchTerm}`)
        .then((result) => {
          const response = result.data['subsonic-response'].searchResult3 ? result.data['subsonic-response'].searchResult3.song : []
          resolve(
            this.mapSongs(response)
          )
        })
        .catch((err) => {
          reject(err)
        })
    })
  }
}
