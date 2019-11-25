import axios from 'axios'

import Song from '../entities/Song'
import { IMusicProvider } from './IMusicProvider'

/**
 * It should implement the Subsonic API
 */
export default class YoutubeDlServerProvider implements IMusicProvider {
  baseUrl: string
  user: string
  password: string
  albumSongsUrl: string
  searchUrl: string
  streamBase: string
  coverBase: string
  providerKey: string

  constructor(settings: any, providerKey: string) {
    this.baseUrl = settings.host
    this.providerKey = providerKey
    this.searchUrl = `${settings.host}/api/info`
    this.playUrl = `${settings.host}/api/play`
  }

  mapSong = (songInfo: any): Song => {
    return new Song({
      title: songInfo.title,
      artistName: songInfo.artist,
      albumName: songInfo.album,
      cover: {
        thumbnailUrl: songInfo.thumbnails[0].url,
        fullUrl: songInfo.thumbnails[0].url,
      },
      genre: '',
      duration: 0,
      track: '',
      filePath: '',
      stream: [
        {
          service: this.providerKey,
          uris: [{uri: `${this.playUrl}?url=${escape(songInfo.webpage_url)}`}]
        }
      ]
    })
  }

  mapSongs = (info: any): Array<any> => {
    if (info._type === 'playlist') {
      return info.entries.map((entry: any) => {
        return this.mapSong(entry)
      })
    } else {
      return this.mapSong(info)
    }
  }

  search(searchTerm: string): Promise<Array<any>> {
    return axios.get(`${this.searchUrl}?url=${escape(searchTerm)}`)
      .then((result) => {
        const response = result.data.info
        return this.mapSongs(response)
      })
      .catch((err) => {
        return err
      })
  }
}
