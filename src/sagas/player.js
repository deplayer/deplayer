// @flow

import { takeLatest, put } from 'redux-saga/effects'
import history from '../store/configureHistory'

import {
  SET_CURRENT_PLAYING,
  START_PLAYING,
  PUSH_TO_VIEW
} from '../constants/ActionTypes'
import Song from '../entities/Song'

// Handling setCurrentPlaying saga
export function* setCurrentPlaying(action: {song: Song}): Generator<void, void, void> {
  // Redirect to song view page
  yield put({type: START_PLAYING})
  // yield put({type: PUSH_TO_VIEW, song: action.song})
}

export function* goToViewPage(action: {song: Song}): Generator<void, void, void> {
  yield history.push(`/song/${ action.song.id }`)
}

// Binding actions to sagas
function* playerSaga(): Generator<void, void, void> {
  yield takeLatest(SET_CURRENT_PLAYING, setCurrentPlaying)
  yield takeLatest(PUSH_TO_VIEW, goToViewPage)
}

export default playerSaga
