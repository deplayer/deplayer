// @flow

import { IRepository } from '../repositories/IRepository'
import { IService } from './IService'

export default class SongService implements IService {
  songRepository: IRepository

  constructor(repository: IRepository) {
    (this:any).search = this.search.bind(this);
    this.songRepository = repository
  }

  search(searchTerm: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.songRepository.search(searchTerm)
        .then((result) => {
          resolve(result)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }
}
