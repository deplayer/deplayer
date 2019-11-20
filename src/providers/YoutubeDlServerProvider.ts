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
    console.log(settings)
    this.baseUrl = settings.host.host // FIXME
    this.providerKey = providerKey
    this.searchUrl = `${settings.host.host}/api/info`
  }

  mapSongs = (info: any): Array<any> => {
    const song = new Song({
      title: info.title,
      artistName: info.artist,
      albumName: info.album,
      cover: {
        thumbnailUrl: info.thumbnails[0].url,
        fullUrl: info.thumbnails[0].url,
      },
      genre: '',
      duration: 0,
      track: '',
      filePath: '',
      stream: [
        {
          service: this.providerKey,
          uris: [{uri: info.url}]
        }
      ]
    })

    return [song]
  }

  search(searchTerm: string): Promise<Array<any>> {
    return axios.get(`${this.searchUrl}?url=${searchTerm}`)
      .then((result) => {
        const response = result.data.info
        return this.mapSongs(response)
      })
      .catch((err) => {
        return err
      })
  }
}
