import { IStorageService } from './IStorageService'
import { IAdapter } from './database/IAdapter'
import logger from '../utils/logger'

export default class PlaylistService implements IStorageService {
  storageAdapter: IAdapter

  constructor(storageAdapter: IAdapter) {
    this.storageAdapter = storageAdapter
  }

  initialize = (model: string) => {
    this.storageAdapter.initialize(model)
  }

  save = (_id: string, payload: any): Promise<any> => {
    return this.storageAdapter.save('playlist', 'playlist', payload)
      .catch((e) => {
        logger.log('Error saving playlist', e.message)
      })
  }

  get = (): Promise<any> => {
    return this.storageAdapter.getAll('playlist', {})
  }
}
