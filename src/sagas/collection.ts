import { RxDocument } from 'rxdb'
import { actionChannel, fork, take, takeLatest, put, call, select } from 'redux-saga/effects'

import { getAdapter } from '../services/database'
import CollectionService from '../services/CollectionService'
import IndexService from '../services/Search/IndexService'
import SearchIndexService from '../services/SearchIndexService'
import Song from '../entities/Song'
import logger from '../utils/logger'
import * as types from '../constants/ActionTypes'

const adapter = getAdapter()
const collectionService = new CollectionService(new adapter())

const rowToSong  = (elem: RxDocument<any, any>): Song => {
  const songPayload = {
    ...elem,
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

const mapToMedia = (collection: Array<RxDocument<any, any>>) => {
  if (!collection.length) {
    return []
  }

  return collection.map((elem) => {
    return rowToSong(elem.get())
  })
}

// Application initialization routines
function* initializeCollection() {
  try {
    yield call(collectionService.initialize)
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
    yield call(collectionService.initialize)
    const searchIndex = yield call(searchIndexService.get)

    console.log('searchIndex: ', searchIndex)

    yield put({type: types.RECEIVE_SEARCH_INDEX, data: searchIndex})
  } catch (e) {
    logger.log('settings-saga', 'initializeSearchIndex', e)
    yield put({type: types.RECEIVE_SEARCH_INDEX_REJECTED, error: e.message})
  }
}

const getCollection = (state: any): any => {
  return state ? state.collection : {}
}

// Handling ADD_TO_COLLECTION saga
export function* saveToCollectionDB(data: any): any {
  const prevCollection = yield select(getCollection)
  yield call (collectionService.bulkSave, data, prevCollection)
  try {
    yield put({type: types.SAVE_COLLECTION_FULLFILLED})
  } catch (e) {
    logger.log('settings-saga', 'addToCollection', e)
    yield put({type: types.SAVE_COLLECTION_FAILED, error: e.message})
  }
}

export function* addToCollectionHandler(): any {
  const handleChannel = yield actionChannel(types.ADD_TO_COLLECTION)

  while (true) {
    const { data } = yield take(handleChannel)

    try {
      yield fork(saveToCollectionDB, data)
      yield put({type: types.RECEIVE_COLLECTION_FINISHED})
    } catch(error) {
      yield put({type: 'ADD_TO_COLLECTION_HANDLER_FAILED', error})
    }
  }
}

// Handling REMOVE_FROM_COLLECTION saga
export function* removeFromCollection(action: any): any {
  try {
    yield collectionService.bulkRemove(action.data)
  } catch (e) {
    yield put({type: types.REMOVE_FROM_COLLECTION_REJECTED, message: e.message})
  }
}

export function* deleteCollection(): any {
  try {
    yield collectionService.removeAll()
    yield put({type: types.REMOVE_FROM_COLLECTION_FULFILLED})
  } catch (e) {
    yield put({type: types.REMOVE_FROM_COLLECTION_REJECTED, message: e.message})
  }
}

export function* exportCollection(): any {
  try {
    const exported = yield collectionService.exportCollection()
    yield put({type: types.EXPORT_COLLECTION_FINISHED, exported})
  } catch (e) {
    yield put({type: types.EXPORT_COLLECTION_REJECTED, message: e.message})
  }
}

export function* importCollection(action: {type: string, data: any}): any {
  logger.log('settings-saga', 'importingCollection')
  const result = yield collectionService.importCollection(action.data)
  yield put({type: types.IMPORT_COLLECTION_FINISHED, result})
}

// generate fulltext index
export function* generateIndex(): any {
  yield call(collectionService.initialize)
  const collection = yield call(collectionService.getAll)
  const mappedData = yield call(mapToMedia, collection)
  const service = new IndexService()
  const { index } = yield call(service.generateIndexFrom, mappedData)

  console.log('index: ', index)

  try {
    yield put({type: types.RECEIVE_SEARCH_INDEX, data: index.toJSON()})
  } catch (e) {
    yield put({type: types.RECEIVE_SEARCH_INDEX_REJECTED, message: e.message})
  }
}

function* trackSongPlayed(action: {type: string, songId: string}): any {
  yield call(collectionService.initialize)
  const songRow = yield call(collectionService.get, action.songId)
  const song = rowToSong(songRow)
  const prevCount = song.playCount || 0
  song.playCount = prevCount + 1
  yield call(collectionService.save, action.songId, song.toDocument())
  yield call(initializeCollection)
}

// Binding actions to sagas
function* collectionSaga(): any {
  yield takeLatest(types.RECEIVE_SETTINGS_FINISHED, initializeCollection)
  yield takeLatest(types.RECEIVE_SETTINGS_FINISHED, initializeSearchIndex)
  yield fork(addToCollectionHandler)
  yield takeLatest(types.REMOVE_FROM_COLLECTION, removeFromCollection)
  yield takeLatest(types.DELETE_COLLECTION, deleteCollection)
  yield takeLatest(types.EXPORT_COLLECTION, exportCollection)
  yield takeLatest(types.IMPORT_COLLECTION, importCollection)
  yield takeLatest(types.RECEIVE_COLLECTION_FINISHED, generateIndex)
  yield takeLatest(types.SONG_PLAYED, trackSongPlayed)
}

export default collectionSaga
