import { takeLatest, call } from 'redux-saga/effects'
import type { SagaIterator } from 'redux-saga'

import NotificatoinService from '../services/NotificationService'
import * as types from '../constants/ActionTypes'

function* setupNotifications(): SagaIterator {
  const notificationService = new NotificatoinService()
  yield call(notificationService.requestPermission)
}

// Binding actions to sagas
function* notificationSaga(): SagaIterator {
  yield takeLatest(types.INITIALIZED, setupNotifications)
}

export default notificationSaga
