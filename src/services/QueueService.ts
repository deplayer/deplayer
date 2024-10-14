import { IStorageService } from './IStorageService'
import { IAdapter, Models } from './database/IAdapter'
import logger from '../utils/logger'

export default class QueueService implements IStorageService {
  storageAdapter: IAdapter

  constructor(storageAdapter: IAdapter) {
    this.storageAdapter = storageAdapter
  }

  initialize = (model: Models) => {
    this.storageAdapter.initialize(model)
  }

  save = async (_id: string, payload: any): Promise<any> => {
    return this.storageAdapter.save('queue', 'queue', payload)
      .catch((e) => {
        logger.log('Error saving queue', e.message)
      })
  }

  get = async (): Promise<any> => {
    const queue = await this.storageAdapter.get('queue', 'queue')
    return queue
  }
}
