import { takeLatest, call } from 'redux-saga/effects'

import { getCurrentSongFromLiveStore } from './selectors';
import * as types from '../constants/ActionTypes'

// Handling setCurrentPlaying saga
function* setCurrentPlaying(): any {
  // Setting current playing title
  const song = yield call(getCurrentSongFromLiveStore)
  if (song && song.title) {
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
