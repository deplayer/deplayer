// @flow

import { takeLatest, put } from 'redux-saga/effects'
import createHistory from 'history/createBrowserHistory'

import {
  SET_CURRENT_PLAYING,
  START_PLAYING
} from '../constants/ActionTypes'
import Song from '../entities/Song'

// Starting history
const history = createHistory()

// Handling setCurrentPlaying saga
export function* setCurrentPlaying(action: {song: Song}): Generator<void, void, void> {
  // Redirect to song view page
  yield history.push(`/song/${ action.song.id }`)
  yield put({type: START_PLAYING})
}

// Binding actions to sagas
function* playerSaga(): Generator<void, void, void> {
  yield takeLatest(SET_CURRENT_PLAYING, setCurrentPlaying)
}

export default playerSaga
