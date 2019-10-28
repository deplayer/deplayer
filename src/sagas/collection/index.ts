// Binding actions to sagas
import { takeLatest, fork } from 'redux-saga/effects'
import * as types from '../../constants/ActionTypes'
import { addToCollectionHandler, initializeCollection } from './handlers'
import {
  deleteCollection,
  exportCollection,
  generateIndex,
  importCollection,
  removeFromCollection,
  trackSongPlayed,
} from './workers'

function* collectionSaga(): any {
  yield takeLatest(types.RECEIVE_SETTINGS_FINISHED, initializeCollection)
  yield fork(addToCollectionHandler)
  yield takeLatest(types.REMOVE_FROM_COLLECTION, removeFromCollection)
  yield takeLatest(types.DELETE_COLLECTION, deleteCollection)
  yield takeLatest(types.EXPORT_COLLECTION, exportCollection)
  yield takeLatest(types.IMPORT_COLLECTION, importCollection)
  yield takeLatest(types.RECEIVE_COLLECTION, generateIndex)
  yield takeLatest(types.SONG_PLAYED, trackSongPlayed)
}

export default collectionSaga
