import { takeLatest, put, call } from 'redux-saga/effects'

import  * as types from '../constants/ActionTypes'
import SettingsService from '../services/SettingsService'
import { getAdapter } from '../services/adapters'

// Application initialization routines
function* initialize() {
  const adapter = getAdapter()
  const settingsService = new SettingsService(new adapter())
  yield settingsService.initialize
  const settings = yield call(settingsService.get)
  if (!settings) {
    yield put({type: types.GET_SETTINGS_REJECTED})
  } else {
    const unserialized = JSON.parse(JSON.stringify(settings))
    yield put({type: types.RECEIVE_SETTINGS, settings: unserialized})
    yield put({type: types.INITIALIZED})
  }
}

function* saveSettings(action: any) {
  const adapter = getAdapter()
  const settingsService = new SettingsService(new adapter())
  yield call(settingsService.save, 'settings', action.settingsPayload)

  yield put({type: types.SETTINGS_SAVED_SUCCESSFULLY})
  yield put({type: types.RECEIVE_SETTINGS, settings: action.settingsPayload})
}

// Binding actions to sagas
function* settingsSaga(): any {
  yield takeLatest(types.INITIALIZE_SETTINGS, initialize)
  yield takeLatest(types.SAVE_SETTINGS, saveSettings)
}

export default settingsSaga
