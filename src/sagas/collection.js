// @flow

import { takeLatest, put, call } from 'redux-saga/effects'

import CollectionService from '../services/CollectionService'
import { getAdapter } from '../services/adapters'

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
function* initialize() {
  try {
    const adapter = getAdapter()
    const collectionService = new CollectionService(new adapter())
    yield call(collectionService.initialize)
    const collection = yield call(collectionService.getAll)
    const mappedData = mapToMedia(collection)
    yield put({type: types.RECEIVE_COLLECTION, data: mappedData})
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

// Binding actions to sagas
function* collectionSaga(): Generator<void, void, void> {
  yield takeLatest(types.INITIALIZED, initialize)
  yield takeLatest(types.ADD_TO_COLLECTION, addToCollection)
  yield takeLatest(types.REMOVE_FROM_COLLECTION, removeFromCollection)
  yield takeLatest(types.DELETE_COLLECTION, deleteCollection)
}

export default collectionSaga
