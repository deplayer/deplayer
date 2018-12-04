// @flow

import { takeLatest, put, select } from 'redux-saga/effects'

import {
  PLAY_ALL,
  ADD_SONGS_TO_QUEUE,
  START_PLAYING
} from '../constants/ActionTypes'

// Extract songs from collection state
export const getSongs  = (state: any) => {
  return state ? state.collection.rows : []
}

// Handling setCurrentPlaying saga
export function* playAll(action: any): Generator<void, void, void> {
  const songs = yield select(getSongs)
  const preparedSongs = Object.keys(songs)
  yield put({type: ADD_SONGS_TO_QUEUE, songs: preparedSongs})
  yield put({type: START_PLAYING})
}

// Binding actions to sagas
function* playerSaga(): Generator<void, void, void> {
  yield takeLatest(PLAY_ALL, playAll)
}

export default playerSaga
