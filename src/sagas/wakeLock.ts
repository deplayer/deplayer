import { takeLatest, call, select } from 'redux-saga/effects'

import { requestWakeLock, releaseWakeLock } from '../services/wakeLock'
import logger from '../utils/logger'
import * as types from '../constants/ActionTypes'
import { getPlayer } from './selectors'
import { Dispatch } from 'redux'

// Handling START_PLAYING saga
export function* startWakeLock(_dispatch: Dispatch): any {
  const player = yield select(getPlayer)

  if (player.playing) {
    try {
      yield call(requestWakeLock)
    } catch (e) {
      logger.log('error setting WakeLock', e)
    }
  }
}

// Handling START_PLAYING saga
export function* stopWakeLock(_dispatch: Dispatch): any {
  const player = yield select(getPlayer)

  if (!player.playing) {
    try {
      yield call(releaseWakeLock)
    } catch (e) {
      logger.log('error disabling WakeLock', e)
    }
  }
}


// Binding actions to sagas
function* wakeLockSaga(store: any): any {
  yield takeLatest(types.START_PLAYING, startWakeLock, store.dispatch)
  yield takeLatest(types.PAUSE_PLAYING, stopWakeLock, store.dispatch)
  yield takeLatest(types.STOP_PLAYING, stopWakeLock, store.dispatch)
  yield takeLatest(types.TOGGLE_PLAYING, stopWakeLock, store.dispatch)
}

export default wakeLockSaga
