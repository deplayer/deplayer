// @flow

import { IRepository } from '../repositories/IRepository'
import { IService } from './IService'

export default class SongService implements IService {
  songRepository: IRepository

  constructor(repository: IRepository) {
    // bind context to search
    (this:any).search = this.search.bind(this);
    this.songRepository = repository
  }

  search(searchTerm: string): Promise<any> {
    const { songRepository } = this
    if (!songRepository) {
      throw Error('songRepository is not defined')
    }

    return new Promise((resolve, reject) => {
      songRepository.search(searchTerm)
        .then((result) => {
          resolve(result)
        })
        .catch((err) => {
          reject(err)
        })
    })
  }
}
