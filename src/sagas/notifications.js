// @flow

import { takeLatest, call } from 'redux-saga/effects'

import NotificatoinService from '../services/NotificationService'
import * as types from '../constants/ActionTypes'

// Handling START_PLAYING saga
export function* sendCurrentPlayingNotification(action: any): any {
  const notificationService = new NotificatoinService()
  yield call(notificationService.initialize)
}

// Binding actions to sagas
function* notificationSaga(): Generator<void, void, void> {
  yield takeLatest(types.SET_CURRENT_PLAYING, sendCurrentPlayingNotification)
}

export default notificationSaga
