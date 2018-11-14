// @flow

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

  get = (id: string): Promise<any> => {
    return this.storageAdapter.get('media', id)
  }

  getAll = (): Promise<any> => {
    return this.storageAdapter.getAll('media')
  }
}
