import { IStorageService } from './IStorageService'
import { IAdapter } from './adapters/IAdapter'

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
        console.log('Error saving queue', e.message)
      })
  }

  get = (): Promise<any> => {
    return this.storageAdapter.get('queue', 'queue')
  }
}
