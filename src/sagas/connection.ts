import { takeLatest, call } from 'redux-saga/effects'

import ConnectionService from '../services/ConnectionService'

import * as types from '../constants/ActionTypes'

// Application initialization routines
function* initialize(dispatch) {
  const connectionService = new ConnectionService()
  yield call(connectionService.registerConnection, dispatch)
}

// Binding actions to sagas
function* connectionSaga(store: any) {
  yield takeLatest(types.INITIALIZED, initialize,  store.dispatch)
}

export default connectionSaga
