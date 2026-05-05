import { takeLatest, call } from 'redux-saga/effects'

import NotificatoinService from '../services/NotificationService'
import * as types from '../constants/ActionTypes'
import { getCurrentSongFromLiveStore } from './selectors'

// Handling START_PLAYING saga
function* sendCurrentPlayingNotification(): Generator<any, void, any> {
  const notificationService = new NotificatoinService()
  const currentSong = yield call(getCurrentSongFromLiveStore)
  
  // Defensive check: only send notification if we have a valid song
  if (currentSong && currentSong.title && currentSong.artist) {
    yield call(notificationService.sendNotification, currentSong)
  } else {
    console.warn('[Notifications] No valid current song to notify about')
  }
}

function* setupNotifications(): Generator<any, void, any> {
  const notificationService = new NotificatoinService()
  yield call(notificationService.requestPermission)
}

// Binding actions to sagas
function* notificationSaga(_store: unknown): Generator<any, void, any> {
  yield takeLatest(types.PLAY_NEXT, sendCurrentPlayingNotification)
  yield takeLatest(types.PLAY_PREV, sendCurrentPlayingNotification)
  yield takeLatest(types.SET_CURRENT_PLAYING, sendCurrentPlayingNotification)
  yield takeLatest(types.INITIALIZED, setupNotifications)
}

export default notificationSaga
