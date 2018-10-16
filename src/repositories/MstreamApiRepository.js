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

  mapResponse = (result: any, searchTerm: string): Array<any> => {
    return result
  }

  search(searchTerm: string): Promise<Array<any>> {
    return new Promise((resolve, reject) => {
      axios.post(this.baseUrl)
        .then((result) => {
          resolve(this.mapResponse(result.data, searchTerm))
        })
        .catch((err) => {
          reject(err)
        })
    })
  }
}
