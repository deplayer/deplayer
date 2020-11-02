import { IStorageService } from './IStorageService'
import { IAdapter } from './database/IAdapter'
import MediaMergerService from './MediaMergerService'
import Media from '../entities/Media'

const MODEL = 'media'

export default class CollectionService implements IStorageService {
  storageAdapter: IAdapter

  constructor(storageAdapter: IAdapter) {
    this.storageAdapter = storageAdapter
  }

  initialize = (model: string = MODEL) => {
    this.storageAdapter.initialize(model)
  }

  save = (id: string, payload: any): Promise<any> => {
    return this.storageAdapter.save(MODEL, id, payload)
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

    return this.storageAdapter.addMany(MODEL, collectionItems)
  }

  bulkRemove = (collection: Array<Media>): Promise<any> => {
    const collectionIds = collection.map((elem) => {
      return elem.id
    })
    return this.storageAdapter.removeMany(MODEL, collectionIds)
  }

  removeAll = (): Promise<any> => {
    return this.storageAdapter.removeCollection(MODEL)
  }

  exportCollection = (): Promise<any> => {
    return this.storageAdapter.exportCollection(MODEL)
  }

  importCollection = (data: any): Promise<any> => {
    return this.storageAdapter.importCollection(MODEL, data)
  }

  get = (id: string): Promise<any> => {
    return this.storageAdapter.get(MODEL, id)
  }

  getAll = (): Promise<Array<any>> => {
    return this.storageAdapter.getAll(MODEL, {})
  }
}
