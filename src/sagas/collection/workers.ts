// Handling ADD_TO_COLLECTION saga
import { put, call, select } from 'redux-saga/effects'

import { getAdapter } from '../../services/database'
import { getCollection } from '../selectors'
import CollectionService from '../../services/CollectionService'
import IndexService from '../../services/Search/IndexService'
import logger from '../../utils/logger'
import rowToSong from '../../mappers/rowToSong'
import * as types from '../../constants/ActionTypes'

const adapter = getAdapter()
const collectionService = new CollectionService(new adapter())

export function* saveToDbWorker(data: Array<any>): any {
  const prevCollection = yield select(getCollection)
  yield call(collectionService.bulkSave, data, prevCollection)
  try {
    yield put({type: types.SAVE_COLLECTION_FULLFILLED})
  } catch (e) {
    logger.log('settings-saga', 'addToCollection', e)
    yield put({type: types.SAVE_COLLECTION_FAILED, error: e.message})
  }
}

// Handling REMOVE_FROM_COLLECTION saga
export function* removeFromDbWorker(action: any): any {
  try {
    yield collectionService.bulkRemove(action.data)
    yield put({type: types.REMOVE_FROM_COLLECTION_FULFILLED})
  } catch (e) {
    yield put({type: types.REMOVE_FROM_COLLECTION_REJECTED, message: e.message})
  }
}

export function* deleteCollectionWorker(): any {
  try {
    yield collectionService.removeAll()
    yield put({type: types.REMOVE_FROM_COLLECTION_FULFILLED})
    yield put({type: types.CLEAR_COLLECTION})
    yield put({type: types.CLEAR_QUEUE})
    yield put({type: types.SEND_NOTIFICATION, notification: 'notifications.collection_deleted'})
  } catch (e) {
    yield put({type: types.REMOVE_FROM_COLLECTION_REJECTED, message: e.message})
  }
}

export function* exportCollectionWorker(): any {
  try {
    const exported = yield collectionService.exportCollection()
    yield put({type: types.EXPORT_COLLECTION_FINISHED, exported})
  } catch (e) {
    yield put({type: types.EXPORT_COLLECTION_REJECTED, message: e.message})
  }
}

export function* importCollectionWorker(action: {type: string, data: any}): any {
  logger.log('settings-saga', 'importingCollection')
  const result = yield collectionService.importCollection(action.data)
  yield put({type: types.IMPORT_COLLECTION_FINISHED, result})
}

// generate fulltext index
export function* generateIndexWorker(service: IndexService): any {
  const collection = yield select(getCollection)
  const index = yield call(service.generateIndexFrom, Object.values(collection.rows))

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
  yield put({type: 'SONG_SAVED'})
  yield put({type: types.UPDATE_MEDIA, media: song})
}
