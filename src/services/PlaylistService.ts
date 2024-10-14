import { IStorageService } from './IStorageService'
import { IAdapter } from './database/IAdapter'

export default class PlaylistService implements IStorageService {
  storageAdapter: IAdapter

  constructor(storageAdapter: IAdapter) {
    this.storageAdapter = storageAdapter
  }

  initialize = (model: 'playlist') => {
    this.storageAdapter.initialize(model)
  }

  save = (_id: string, payload: any): Promise<any> => {
    return this.storageAdapter.save('playlist', 'playlist', payload)
  }

  get = (): Promise<any> => {
    return this.storageAdapter.getAll('playlist', {})
  }
}
