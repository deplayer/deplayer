// @flow
import axios from 'axios'

import IRepository from './IRepository'

export default class ItunesApiRepository implements IRepository {

  search(searchTerm: string): Promise<any> {
    return axios.get()
  }
}
