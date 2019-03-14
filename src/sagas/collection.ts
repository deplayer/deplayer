import { takeLatest, put, call } from 'redux-saga/effects'

import CollectionService from '../services/CollectionService'
import SettingsService from '../services/SettingsService'
import { getAdapter } from '../services/adapters'
import IndexService from '../services/Search/IndexService'

import * as types from '../constants/ActionTypes'

const mapToMedia = (collection: Array<any>) => {
  if (!collection.length) {
    return []
  }

  return collection.map((elem) => {
    return {
      ...elem.get(),
      ...{
        artist: { name: elem.artist.name },
        artistName: elem.artist.name,
        thumbnailUrl: elem.cover.thumbnailUrl,
        fullUrl: elem.cover.thumbnailUrl
      }
    }
  })
}

// Application initialization routines
function* initializeCollection() {
  try {
    const adapter = getAdapter()
    const collectionService = new CollectionService(new adapter())
    yield collectionService.initialize
    const collection = yield call(collectionService.getAll)
    const mappedData = mapToMedia(collection)
    yield put({type: types.RECEIVE_COLLECTION, data: mappedData})
  } catch (e) {
    yield put({type: types.RECEIVE_COLLECTION_REJECTED, error: e.message})
  }
}

// SearchIndex initialization
function* initializeSearchIndex() {
  try {
    const adapter = getAdapter()
    const settingsService = new SettingsService(new adapter())
    yield settingsService.initialize
    const searchIndex = yield call(settingsService.get, 'search_index')
    yield put({type: types.RECEIVE_SEARCH_INDEX, data: searchIndex})
  } catch (e) {
    yield put({type: types.RECEIVE_COLLECTION_REJECTED, error: e.message})
  }
}

// Handling ADD_TO_COLLECTION saga
export function* addToCollection(action: any): any {
  const adapter = getAdapter()
  const collectionService = new CollectionService(new adapter())
  const collection = yield collectionService.bulkSave(action.data)
  const mappedData = mapToMedia(collection)
  yield put({type: types.RECEIVE_COLLECTION, data: mappedData})
}

// Handling REMOVE_FROM_COLLECTION saga
export function* removeFromCollection(action: any): any {
  try {
    const adapter = getAdapter()
    const collectionService = new CollectionService(new adapter())
    yield collectionService.bulkRemove(action.data)
  } catch (e) {
    yield put({type: types.REMOVE_FROM_COLLECTION_REJECTED, message: e.message})
  }
}

export function* deleteCollection(): any {
  try {
    const adapter = getAdapter()
    const collectionService = new CollectionService(new adapter())
    yield collectionService.removeAll()
  } catch (e) {
    yield put({type: types.REMOVE_FROM_COLLECTION_REJECTED, message: e.message})
  }
}

// generate fulltext index
export function* generateIndex(action): any {
  const adapter = getAdapter()
  const collectionService = new CollectionService(new adapter())
  yield collectionService.initialize
  const collection = yield call(collectionService.getAll)
  const mappedData = mapToMedia(collection)
  const service = new IndexService()
  const index = service.generateIndexFrom(mappedData)
  const settingsService = new SettingsService(new adapter())
  yield call(settingsService.save, 'search_index', index)


}

// Binding actions to sagas
function* collectionSaga(): any {
  yield takeLatest(types.INITIALIZED, initializeCollection)
  yield takeLatest(types.INITIALIZED, initializeSearchIndex)
  yield takeLatest(types.ADD_TO_COLLECTION, addToCollection)
  yield takeLatest(types.ADD_TO_COLLECTION, generateIndex)
  yield takeLatest(types.REMOVE_FROM_COLLECTION, removeFromCollection)
  yield takeLatest(types.DELETE_COLLECTION, deleteCollection)
}

export default collectionSaga
