import { type Effect, takeLatest, call, select } from 'redux-saga/effects'

import WakeLock from '../services/wakeLock'
import logger from '../utils/logger'
import * as types from '../constants/ActionTypes'
import { getPlayer } from './selectors'
import type { State } from '../reducers'

// Handling START_PLAYING saga
function* startWakeLock(): Generator<Effect, void, unknown> {
  const player = (yield select(getPlayer)) as State['player']

  if (player.playing) {
    try {
      yield call(WakeLock.requestWakeLock)
    } catch (e) {
      logger.log('error setting WakeLock', e)
    }
  }
}

// Handling START_PLAYING saga
function* stopWakeLock(): Generator<Effect, void, unknown> {
  const player = (yield select(getPlayer)) as State['player']

  if (!player.playing) {
    try {
      yield call(WakeLock.releaseWakeLock)
    } catch (e) {
      logger.log('error disabling WakeLock', e)
    }
  }
}


// Binding actions to sagas
function* wakeLockSaga(): Generator<Effect, void, unknown> {
  yield takeLatest(types.START_PLAYING, startWakeLock)
  yield takeLatest(types.PAUSE_PLAYING, stopWakeLock)
  yield takeLatest(types.STOP_PLAYING, stopWakeLock)
}

export default wakeLockSaga
