// @flow

import axios from 'axios'

import { IRepository } from './IRepository'

export default class ItunesApiRepository implements IRepository {
  baseUrl = 'https://itunes.apple.com'

  search(searchTerm: string): Promise<any> {
    return axios.get(`${this.baseUrl}/search`)
  }
}
