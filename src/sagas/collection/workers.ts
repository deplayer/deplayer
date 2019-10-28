// Handling ADD_TO_COLLECTION saga
import { put, call, select } from 'redux-saga/effects'

import { getAdapter } from '../../services/database'
import { getCollection } from '../selectors'
import { initializeCollection } from './handlers'
import CollectionService from '../../services/CollectionService'
import IndexService from '../../services/Search/IndexService'
import logger from '../../utils/logger'
import mapToMedia from '../../mappers/mapToMedia'
import rowToSong from '../../mappers/rowToSong'
import * as types from '../../constants/ActionTypes'

const adapter = getAdapter()
const collectionService = new CollectionService(new adapter())

export function* saveToDbWorker(data: any): any {
  const prevCollection = yield select(getCollection)
  yield call (collectionService.bulkSave, data, prevCollection)
  try {
    yield put({type: types.SAVE_COLLECTION_FULLFILLED})
  } catch (e) {
    logger.log('settings-saga', 'addToCollection', e)
    yield put({type: types.SAVE_COLLECTION_FAILED, error: e.message})
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
    yield put({type: types.ADD_TO_COLLECTION, data: []})
    yield put({type: types.SEND_NOTIFICATION, notification: 'notifications.collection_deleted'})
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
  const index = yield call(service.generateIndexFrom, mappedData)

  try {
    const data = JSON.parse(
      JSON.stringify(index)
    )
    yield put({type: types.RECEIVE_SEARCH_INDEX, data})
  } catch (e) {
    yield put({type: types.RECEIVE_SEARCH_INDEX_REJECTED, message: e.message})
  }
}

export function* trackSongPlayed(action: {type: string, songId: string}): any {
  yield call(collectionService.initialize)
  const songRow = yield call(collectionService.get, action.songId)
  const song = rowToSong(songRow)
  const prevCount = song.playCount || 0
  song.playCount = prevCount + 1
  yield call(collectionService.save, action.songId, song.toDocument())
  yield call(initializeCollection)
}
