// @flow

import { takeLatest, put, select } from 'redux-saga/effects'

import {
  PLAY_ALL,
  ADD_SONGS_TO_QUEUE,
  START_PLAYING,
  SET_CURRENT_PLAYING
} from '../constants/ActionTypes'

// Extract songs from collection state
export const getSongs  = (state: any): Array<string> => {
  return state ? state.collection.visibleSongs : []
}

// Handling setCurrentPlaying saga
export function* playAll(action: any): Generator<void, void, void> {
  const songs = yield select(getSongs)
  yield put({type: ADD_SONGS_TO_QUEUE, songs: songs})
  yield put({type: SET_CURRENT_PLAYING, song: songs[0]})
  yield put({type: START_PLAYING})
}

// Binding actions to sagas
function* playerSaga(): Generator<void, void, void> {
  yield takeLatest(PLAY_ALL, playAll)
}

export default playerSaga
