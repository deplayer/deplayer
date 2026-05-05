import { takeLatest, call } from 'redux-saga/effects'

import { getCurrentSongFromLiveStore } from './selectors';
import * as types from '../constants/ActionTypes'

// Handling setCurrentPlaying saga
function* setCurrentPlaying(): Generator<any, void, any> {
  // Setting current playing title
  const song = yield call(getCurrentSongFromLiveStore)
  if (song?.title) {
    const artistName = song.artist?.name || song.artistName || 'Unknown Artist'
    document.title = `${song.title} - ${artistName}`
  }
}

// Binding actions to sagas
function* titleSaga(): Generator<any, void, any> {
  yield takeLatest(types.SET_CURRENT_PLAYING, setCurrentPlaying)
  yield takeLatest(types.PLAY_NEXT, setCurrentPlaying)
  yield takeLatest(types.PLAY_PREV, setCurrentPlaying)
}

export default titleSaga
