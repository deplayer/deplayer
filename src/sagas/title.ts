import { takeLatest, select } from 'redux-saga/effects'

import * as types from '../constants/ActionTypes'

const getQueue = (state: any): any => {
  return state ? state.queue : {}
}

const getCollection = (state: any): any => {
  return state ? state.collection : {}
}

// Handling setCurrentPlaying saga
export function* setCurrentPlaying(action: any): any {
  // Setting current playing title
  const queue = yield select(getQueue)
  const collection = yield select(getCollection)
  const song = collection.rows[queue.currentPlaying]
  if (song.title) {
    document.title = song.title + ' - ' + song.artist.name
  }
}

// Binding actions to sagas
function* titleSaga(): any {
  yield takeLatest(types.SET_CURRENT_PLAYING, setCurrentPlaying)
  yield takeLatest(types.PLAY_NEXT, setCurrentPlaying)
  yield takeLatest(types.PLAY_PREV, setCurrentPlaying)
}

export default titleSaga
