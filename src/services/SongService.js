// @flow

import { IRepository } from '../repositories/IRepository'
import { ISearchService } from './ISearchService'
import Song from '../entities/Song'

export default class SongService implements ISearchService {
  songRepository: IRepository

  constructor(repository: IRepository) {
    // bind context to search
    (this:any).search = this.search.bind(this);
    this.songRepository = repository
  }

  search(searchTerm: string): Promise<Array<Song>> {
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
