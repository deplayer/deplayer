import { takeLatest, put, call, select } from 'redux-saga/effects'

import CollectionService from '../services/CollectionService'
import SearchIndexService from '../services/SearchIndexService'
import { getAdapter } from '../services/database'
import IndexService from '../services/Search/IndexService'
import logger from '../utils/logger'
import Song from '../entities/Song'

import * as types from '../constants/ActionTypes'

const rowToSong  = (elem): Song => {
  const songPayload = {
    ...elem.get(),
    ...{
      albumName: elem.album.name,
      artistName: elem.artist.name,
    }
  }

  if (elem.artist.id) {
    // Forcing id since its comming from database
    songPayload['artistId'] = elem.artist.id
  }

  if (elem.album.id) {
    // Forcing id since its comming from database
    songPayload['albumId'] = elem.album.id
  }

  if (elem._id) {
    // Forcing id since its comming from database
    songPayload['forcedId'] = elem._id
  }

  return new Song(songPayload)
}

const mapToMedia = (collection: Array<Song>) => {
  if (!collection.length) {
    return []
  }

  return collection.map((elem) => {
    return rowToSong(elem)
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
    yield put({type: types.INITIALIZED})
  } catch (e) {
    logger.log('settings-saga', 'initializeCollection', e)
    yield put({type: types.RECEIVE_COLLECTION_REJECTED, error: e.message})
  }
}

// SearchIndex initialization
function* initializeSearchIndex() {
  try {
    const adapter = getAdapter()
    const searchIndexService = new SearchIndexService(new adapter())
    yield searchIndexService.initialize
    const searchIndex = yield searchIndexService.get()
    yield put({type: types.RECEIVE_SEARCH_INDEX, data: searchIndex})
  } catch (e) {
    logger.log('settings-saga', 'initializeSearchIndex', e)
    yield put({type: types.RECEIVE_COLLECTION_REJECTED, error: e.message})
  }
}

const getCollection = (state: any): any => {
  return state ? state.collection : {}
}

// Handling ADD_TO_COLLECTION saga
export function* addToCollection(action: any): any {
  const adapter = getAdapter()
  const prevCollection = yield select(getCollection)
  const collectionService = new CollectionService(new adapter())
  const collection = yield collectionService.bulkSave(action.data, prevCollection)
  const mappedData = mapToMedia(collection)
  try {
    yield put({type: types.RECEIVE_COLLECTION, data: mappedData})
    yield put({type: types.RECEIVE_COLLECTION_FINISHED})
  } catch (e) {
    logger.log('settings-saga', 'addToCollection', e)
    yield put({type: types.RECEIVE_COLLECTION_REJECTED, error: e.message})
  }

  yield generateIndex(action)
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
    yield put({type: types.REMOVE_FROM_COLLECTION_FULFILLED})
  } catch (e) {
    yield put({type: types.REMOVE_FROM_COLLECTION_REJECTED, message: e.message})
  }
}

export function* exportCollection(): any {
  try {
    const adapter = getAdapter()
    const collectionService = new CollectionService(new adapter())
    const exported = yield collectionService.exportCollection()
    yield put({type: types.EXPORT_COLLECTION_FINISHED, exported})
  } catch (e) {
    yield put({type: types.EXPORT_COLLECTION_REJECTED, message: e.message})
  }
}

export function* importCollection(action): any {
  logger.log('settings-saga', 'importingCollection')
  const adapter = getAdapter()
  const collectionService = new CollectionService(new adapter())
  // FIXME: This model name knowledge doesn't belongs here
  logger.log('settings-saga', 'importing provided data')
  const result = yield collectionService.importCollection(action.data)
  yield put({type: types.IMPORT_COLLECTION_FINISHED, result})
}

// generate fulltext index
export function* generateIndex(action): any {
  const adapter = getAdapter()
  const collectionService = new CollectionService(new adapter())
  yield collectionService.initialize
  const collection = yield call(collectionService.getAll)
  const mappedData = mapToMedia(collection)
  const service = new IndexService()
  const { index } = service.generateIndexFrom(mappedData)
  try {
    yield put({type: types.RECEIVE_SEARCH_INDEX, data: index.toJSON()})
  } catch (e) {
    yield put({type: types.RECEIVE_SEARCH_INDEX_REJECTED, message: e.message})
  }
}

// Binding actions to sagas
function* collectionSaga(): any {
  yield takeLatest(types.RECEIVE_SETTINGS_FINISHED, initializeCollection)
  yield takeLatest(types.RECEIVE_SETTINGS_FINISHED, initializeSearchIndex)
  yield takeLatest(types.ADD_TO_COLLECTION, addToCollection)
  yield takeLatest(types.REMOVE_FROM_COLLECTION, removeFromCollection)
  yield takeLatest(types.DELETE_COLLECTION, deleteCollection)
  yield takeLatest(types.EXPORT_COLLECTION, exportCollection)
  yield takeLatest(types.IMPORT_COLLECTION, importCollection)
}

export default collectionSaga
