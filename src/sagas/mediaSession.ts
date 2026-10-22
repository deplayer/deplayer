import { takeLatest } from 'redux-saga/effects'
import { Dispatch } from 'redux'

import type { MediaRow } from '../types/media'
import MediaSessionService from '../services/MediaSessionService'
import PlayerRefService from '../services/PlayerRefService'
import logger from '../utils/logger'
import * as types from '../constants/ActionTypes'

const mediaSessionService = MediaSessionService.getInstance()

function setTrackMetadata(action: { type: string; media: MediaRow }): void {
  try {
    mediaSessionService.updateMetadata(action.media)
  } catch (e) {
    logger.log('error setting MediaSessionService', e)
  }
}

function clearPlaybackState(): void {
  mediaSessionService.setPlaybackState('none')
}

function clearSession(): void {
  mediaSessionService.clear()
}

function* mediaSessionSaga(store: { dispatch: Dispatch }): Generator<unknown, void, unknown> {
  mediaSessionService.registerHandlers(store.dispatch, PlayerRefService.getInstance())
  yield takeLatest(types.TRACK_STARTED, setTrackMetadata)
  yield takeLatest(types.STOP_PLAYING, clearPlaybackState)
  yield takeLatest(types.PLAYBACK_IDLE, clearSession)
}

export default mediaSessionSaga
