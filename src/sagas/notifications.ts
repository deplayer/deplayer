import { takeLatest, call, select } from 'redux-saga/effects'

import NotificatoinService from '../services/NotificationService'
import * as types from '../constants/ActionTypes'

const getCurrentSong = (state: any) => {
  if (!state) {
    return
  }

  const rows = state.collection.rows
  const currentId = state.queue.currentPlaying
  return rows[currentId]
}

// Handling START_PLAYING saga
export function* sendCurrentPlayingNotification(dispatch: any, action: any): any {
  const notificationService = new NotificatoinService()
  const currentSong = yield select(getCurrentSong)
  yield call(notificationService.sendNotification, currentSong)
}

export function* setupNotifications(dispatch: any, action: any): any {
  const notificationService = new NotificatoinService()
  yield call(notificationService.requestPermission)
}

// Binding actions to sagas
function* notificationSaga(store: any): any {
  yield takeLatest(types.PLAY_NEXT, sendCurrentPlayingNotification, store.dispatch)
  yield takeLatest(types.PLAY_PREV, sendCurrentPlayingNotification, store.dispatch)
  yield takeLatest(types.SET_CURRENT_PLAYING, sendCurrentPlayingNotification, store.dispatch)
  yield takeLatest(types.INITIALIZED, setupNotifications, store.dispatch)
}

export default notificationSaga
