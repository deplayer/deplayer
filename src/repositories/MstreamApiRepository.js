// @flow

import axios from 'axios'

import { IRepository } from './IRepository'

/**
 * It should implement the API documented here: https://github.com/IrosTheBeggar/mStream/blob/master/docs/API/db_search.md
 */
export default class MstreamApiRepository implements IRepository {
  baseUrl: string

  constructor() {
    this.baseUrl = '/db/album-songs'
  }

  matchSearch = (song: any, searchTerm: string) => {
    const re = new RegExp(searchTerm, 'gi')
    return re.test(song.metadata.artist)
      || re.test(song.metadata.album)
      || re.test(song.metadata.title)
  }

  mapResponse = (result: any, searchTerm: string): Array<any> => {
    return result.filter((resultSong) => {
      return this.matchSearch(resultSong, searchTerm)
    })
  }

  search(searchTerm: string): Promise<Array<any>> {
    return new Promise((resolve, reject) => {
      axios.post(this.baseUrl)
        .then((result) => {
          const mappedSongs = this.mapResponse(result.data, searchTerm)
          resolve(mappedSongs)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }
}
