// Binding actions to sagas
import { takeLatest, fork } from 'redux-saga/effects'
import * as types from '../../constants/ActionTypes'
import { addToCollectionWatcher, initializeWatcher } from './watchers'
import {
  deleteCollectionWorker,
  exportCollectionWorker,
  generateIndexWorker,
  importCollectionWorker,
  removeFromDbWorker,
  trackSongPlayed,
} from './workers'

function* collectionSaga(): any {
  yield fork(initializeWatcher)
  yield fork(addToCollectionWatcher)
  yield takeLatest(types.REMOVE_FROM_COLLECTION, removeFromDbWorker)
  yield takeLatest(types.DELETE_COLLECTION, deleteCollectionWorker)
  yield takeLatest(types.EXPORT_COLLECTION, exportCollectionWorker)
  yield takeLatest(types.IMPORT_COLLECTION, importCollectionWorker)
  yield takeLatest(types.SONG_PLAYED, trackSongPlayed)
}

export default collectionSaga
