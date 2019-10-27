import { IStorageService } from '../IStorageService'
import { IAdapter } from '../database/IAdapter'

const MODEL = 'settings'

export default class SettingsService implements IStorageService {
  storageAdapter: IAdapter

  constructor(storageAdapter: IAdapter) {
    this.storageAdapter = storageAdapter
  }

  initialize = async (model: string = MODEL) => {
    await this.storageAdapter.initialize(model)
  }

  save = (id: string, payload: any): Promise<any> => {
    return this.storageAdapter.save(MODEL, id, payload)
  }

  get = (id: string = MODEL): Promise<any> => {
    return this.storageAdapter.get(MODEL, id)
  }

  removeAll = (): Promise<any> => {
    return this.storageAdapter.removeCollection(MODEL)
  }
}
