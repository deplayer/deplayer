import { IStorageService } from './IStorageService'
import { IAdapter } from './adapters/IAdapter'

import Media from '../entities/Media'

export default class CollectionService implements IStorageService {
  storageAdapter: IAdapter

  constructor(storageAdapter: IAdapter) {
    this.storageAdapter = storageAdapter
  }

  initialize = (model: string) => {
    this.storageAdapter.initialize(model)
  }

  save = (id: string, payload: any): Promise<any> => {
    return this.storageAdapter.save('media', id, payload)
  }

  bulkSave = (collection: Array<Media>): Promise<any> => {
    const collectionItems = collection.map((elem) => {
      return elem.toDocument()
    })
    return this.storageAdapter.addMany('media', collectionItems)
  }

  bulkRemove = (collection: Array<Media>): Promise<any> => {
    const collectionIds = collection.map((elem) => {
      return elem.id
    })
    return this.storageAdapter.removeMany('media', collectionIds)
  }

  removeAll = (): Promise<any> => {
    return this.storageAdapter.removeCollection('media')
  }

  get = (id: string): Promise<any> => {
    return this.storageAdapter.get('media', id)
  }

  getAll = (excludeProviders: any = {}): Promise<any> => {
    return this.storageAdapter.getAll('media', {})
  }
}
