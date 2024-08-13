// Binding actions to sagas
import { takeLatest, fork } from 'redux-saga/effects'
import * as types from '../../constants/ActionTypes'
import { addToCollectionWatcher, initializeWatcher } from './watchers'
import IndexService from '../../services/Search/IndexService'

import {
  deleteCollectionWorker,
  exportCollectionWorker,
  importCollectionWorker,
  removeFromDbWorker,
  trackSongPlayed,
  generateIndexWorker
} from './workers'

const indexService = new IndexService()

function* collectionSaga(): any {
  yield fork(initializeWatcher)
  yield fork(addToCollectionWatcher)
  yield takeLatest(types.REMOVE_FROM_COLLECTION, removeFromDbWorker)
  yield takeLatest(types.DELETE_COLLECTION, deleteCollectionWorker)
  yield takeLatest(types.EXPORT_COLLECTION, exportCollectionWorker)
  yield takeLatest(types.IMPORT_COLLECTION, importCollectionWorker)
  yield takeLatest(types.SONG_PLAYED, trackSongPlayed)
  yield takeLatest(types.RECREATE_INDEX, generateIndexWorker, indexService)
}

export default collectionSaga
