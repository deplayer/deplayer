// @flow

import { takeLatest, call, select, put } from 'redux-saga/effects'

import MediaSessionService from '../services/MediaSessionService'
import * as types from '../constants/ActionTypes'

const getCurrentSong = (state: any) => {
  if (!state) {
    return
  }

  const rows = state.collection.rows
  const currentId = state.queue.currentPlaying
  return rows[currentId]
}

function dispatch(action: string) {
  put(action)
}

// Handling START_PLAYING saga
export function* setCurrentPlayingMeta (action: any): any {
  const mediaSessionService = new MediaSessionService()
  const currentSong = yield select(getCurrentSong)
  yield call(mediaSessionService.updateMetadata, currentSong, dispatch)
}

// Binding actions to sagas
function* mediaSessionSaga(): Generator<void, void, void> {
  yield takeLatest(types.SET_CURRENT_PLAYING, setCurrentPlayingMeta)
  yield takeLatest(types.PLAY_NEXT, setCurrentPlayingMeta)
  yield takeLatest(types.PLAY_PREV, setCurrentPlayingMeta)
}

export default mediaSessionSaga
