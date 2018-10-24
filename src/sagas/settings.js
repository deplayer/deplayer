// @flow

import { takeLatest, put, call } from 'redux-saga/effects'

import  * as types from '../constants/ActionTypes'
import SettingsService from '../services/SettingsService'
import RxdbAdapter from '../services/adapters/RxdbAdapter'
import DummyAdapter from '../services/adapters/DummyAdapter'

// Returns adapter depending on environment
function getAdapter() {
  return process.env.NODE_ENV === 'test' ? DummyAdapter : RxdbAdapter
}

// Application initialization routines
function* initialize() {
  const adapter = getAdapter()
  const settingsService = new SettingsService(new adapter())
  yield call(settingsService.initialize)
  const settings = yield call(settingsService.get)
  yield put({type: types.RECEIVE_SETTINGS, settings})
}

function* saveSettings(action: any) {
  const adapter = getAdapter()
  const settingsService = new SettingsService(new adapter())
  yield call(settingsService.save, 'settings', action.settingsPayload)

  yield put({type: types.SETTINGS_SAVED_SUCCESSFULLY})
  yield put({type: types.RECEIVE_SETTINGS, settings: action.settingsPayload})
}

// Binding actions to sagas
function* settingsSaga(): Generator<void, void, void> {
  yield takeLatest(types.INITIALIZED, initialize)
  yield takeLatest(types.SAVE_SETTINGS, saveSettings)
}

export default settingsSaga
