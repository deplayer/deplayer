import { takeLatest, call } from 'redux-saga/effects'
import { Dispatch } from 'redux'

import { getCurrentSongFromLiveStore } from './selectors'
import MediaSessionService from '../services/MediaSessionService'
import logger from '../utils/logger'
import * as types from '../constants/ActionTypes'

// Handling START_PLAYING saga
function* setCurrentPlayingMeta (dispatch: Dispatch): any {
  const mediaSessionService = new MediaSessionService()
  const currentSong = yield call(getCurrentSongFromLiveStore)
  try {
    yield call(mediaSessionService.updateMetadata, currentSong, dispatch)
  } catch (e) {
    logger.log('error setting MediaSessionService', e)
  }
}

// Binding actions to sagas
function* mediaSessionSaga(store: any): any {
  yield takeLatest(types.SET_CURRENT_PLAYING, setCurrentPlayingMeta, store.dispatch)
  yield takeLatest(types.PLAY_NEXT, setCurrentPlayingMeta, store.dispatch)
  yield takeLatest(types.PLAY_PREV, setCurrentPlayingMeta, store.dispatch)
}

export default mediaSessionSaga
