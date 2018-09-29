// @flow

import axios from 'axios'

import { IRepository } from './IRepository'
import Song from '../entities/Song'

export default class ItunesApiRepository implements IRepository {
  baseUrl = 'https://itunes.apple.com'

  populateUrl(searchTerm: string): string {
    return `${this.baseUrl}/search?term=${encodeURIComponent(searchTerm)}`
  }

  mapResponse(result: any): Array<Song> {
    return result.data.results.map((itSong) => {
      return this.songFromItSong(itSong)
    })
  }

  songFromItSong(itSong: any) {
    return new Song({
      artistName: itSong.artistName,
      title: itSong.trackName
    })
  }

  search(searchTerm: string): Promise<any> {
    return new Promise((resolve, reject) => {
      axios.get(this.populateUrl(searchTerm))
        .then((result) => {
          resolve(this.mapResponse(result))
        })
        .catch((err) => {
          reject(err)
        })
    })
  }
}
