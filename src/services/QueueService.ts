import { IStorageService } from './IStorageService'
import { IAdapter } from './adapters/IAdapter'
import logger from '../utils/logger'

export default class QueueService implements IStorageService {
  storageAdapter: IAdapter

  constructor(storageAdapter: IAdapter) {
    this.storageAdapter = storageAdapter
  }

  initialize = (model: string) => {
    this.storageAdapter.initialize(model)
  }

  save = (id: string, payload: any): Promise<any> => {
    return this.storageAdapter.save('queue', 'queue', payload)
      .catch((e) => {
        logger.log('Error saving queue', e.message)
      })
  }

  get = (): Promise<any> => {
    return this.storageAdapter.get('queue', 'queue')
  }
}
