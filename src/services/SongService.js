// @flow

import { IRepository } from '../repositories/IRepository'
import { IService } from './IService'

export default class SongService implements IService {
  songRepository: IRepository

  constructor(repository: IRepository) {
    this.songRepository = repository
  }

  search(searchTerm: string) {
    return this.songRepository.search(searchTerm)
  }
}
