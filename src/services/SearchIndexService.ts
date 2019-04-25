import { IStorageService } from './IStorageService'
import { IAdapter } from './database/IAdapter'
import logger from '../utils/logger'

export default class SearchIndexService implements IStorageService {
  storageAdapter: IAdapter

  constructor(storageAdapter: IAdapter) {
    this.storageAdapter = storageAdapter
  }

  initialize = (model: string) => {
    this.storageAdapter.initialize(model)
  }

  save = (id: string, payload: any): Promise<any> => {
    logger.log('search index saving: ', payload)
    return this.storageAdapter.save('search_index', 'search_index', payload)
      .catch((e) => {
        logger.log('Error saving search_index', e.message)
      })
  }

  get = (): Promise<any> => {
    return this.storageAdapter.get('search_index', 'search_index')
  }
}
