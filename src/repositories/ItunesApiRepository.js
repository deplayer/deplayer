// @flow

import axios from 'axios'

import { IRepository } from './IRepository'

export default class ItunesApiRepository implements IRepository {
  baseUrl = 'https://itunes.apple.com'

  populateUrl(searchTerm: string): string {
    return `${this.baseUrl}/search?term=${encodeURIComponent(searchTerm)}`
  }

  search(searchTerm: string): Promise<any> {
    return axios.get(this.populateUrl(searchTerm))
  }
}
