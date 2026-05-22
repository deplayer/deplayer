import { takeLatest, call } from 'redux-saga/effects'
import { Dispatch } from 'redux'

import { getCurrentSongFromLiveStore } from './selectors'
import type { TransformedMedia } from './selectors'
import MediaSessionService from '../services/MediaSessionService'
import logger from '../utils/logger'
import * as types from '../constants/ActionTypes'

const mediaSessionService = MediaSessionService.getInstance()

function* setCurrentPlayingMeta(): Generator<unknown, void, TransformedMedia | null> {
  const currentSong = yield call(getCurrentSongFromLiveStore)
  try {
    mediaSessionService.updateMetadata(currentSong)
  } catch (e) {
    logger.log('error setting MediaSessionService', e)
  }
}

function* mediaSessionSaga(store: { dispatch: Dispatch }): Generator<unknown, void, unknown> {
  mediaSessionService.registerHandlers(store.dispatch)
  yield takeLatest(types.SET_CURRENT_PLAYING, setCurrentPlayingMeta)
  yield takeLatest(types.PLAY_NEXT, setCurrentPlayingMeta)
  yield takeLatest(types.PLAY_PREV, setCurrentPlayingMeta)
}

export default mediaSessionSaga
