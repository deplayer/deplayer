// @flow

import axios from 'axios'

import Song from '../entities/Song'
import { IProvider } from './IProvider'

/**
 * It should implement the API documented here: https://github.com/IrosTheBeggar/mStream/blob/master/docs/API/db_search.md
 */
export default class SubsonicApiProvider implements IProvider {
  baseUrl: string
  user: string
  password: string
  albumSongsUrl: string
  searchUrl: string
  streamBase: string
  coverBase: string

  constructor(settings: any) {
    const appName = 'genar-radio'
    const songCount = 1000
    const artistCount = 1000
    this.baseUrl = settings.baseUrl
    this.user = settings.user
    this.password = settings.password
    this.albumSongsUrl = `${settings.baseUrl}/rest/getMusicFolders.view?u=${settings.user}&p=${settings.password}&c=${appName}&v=1.11.0&f=json`
    this.searchUrl = `${settings.baseUrl}/rest/search3.view?songCount=${songCount}&artistCount=${artistCount}&u=${settings.user}&p=${settings.password}&c=${appName}&v=1.11.0&f=json`
    this.streamBase = `${settings.baseUrl}/rest/stream.view?u=${settings.user}&p=${settings.password}&c=${appName}&v=1.11.0&f=json`
    this.coverBase = `${settings.baseUrl}/rest/getCoverArt.view?u=${settings.user}&p=${settings.password}&c=${appName}&v=1.11.0&f=json`
  }

  mapSongs = (songs: Array<any>): Array<any> => {
    const secureSongs = songs instanceof Array ? songs : [songs]
    return secureSongs.map((song: any) => {
      return new Song({
        id: "" + song.id,
        title: song.title ? song.title : song.path,
        artistName: song.artist,
        albumName: song.album,
        thumbnailUrl: this.coverBase + '&id=' + song.coverArt,
        fullUrl: this.coverBase + '&id=' + song.coverArt,
        duration: song.duration * 1000,
        stream: [
          {
            service: 'subsonic',
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
          resolve(this.mapSongs(result.data['subsonic-response'].searchResult3.song))
        })
        .catch((err) => {
          reject(err)
        })
    })
  }
}
