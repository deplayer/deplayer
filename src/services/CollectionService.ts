import { IStorageService } from './IStorageService'
import { IAdapter } from './database/IAdapter'
import MediaMergerService from './MediaMergerService'

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

  bulkSave = (collection: Array<Media>, prevCollection: any): Promise<any> => {
    const collectionItems = collection.map((elem) => {
      if (prevCollection.rows[elem.id]) {

        const prevItem = prevCollection.rows[elem.id]
        const mediaMergerService = new MediaMergerService(prevItem, elem)

        const mergedMedia = mediaMergerService.getMerged()

        return mergedMedia.toDocument()
      }

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

  exportCollection = (): Promise<any> => {
    return this.storageAdapter.exportCollection('media')
  }

  importCollection = (data): Promise<any> => {
    return this.storageAdapter.importCollection('media', data)
  }

  get = (id: string): Promise<any> => {
    return this.storageAdapter.get('media', id)
  }

  getAll = (excludeProviders: any = {}): Promise<any> => {
    return this.storageAdapter.getAll('media', {})
  }
}
