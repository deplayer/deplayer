import { IStorageService } from '../IStorageService'
import { IAdapter } from '../adapters/IAdapter'

export default class SettingsService implements IStorageService {
  storageAdapter: IAdapter

  constructor(storageAdapter: IAdapter) {
    this.storageAdapter = storageAdapter
  }

  initialize = (model: string) => {
    this.storageAdapter.initialize(model)
  }

  save = (id: string, payload: any): Promise<any> => {
    return this.storageAdapter.save('settings', id, payload)
      .catch((e) => {
        console.log('Error saving settings', e.message)
      })
  }

  get = (id: string = 'settings'): Promise<any> => {
    return this.storageAdapter.get('settings', id)
  }

  removeAll = (): Promise<any> => {
    return this.storageAdapter.removeCollection('settings')
  }
}
