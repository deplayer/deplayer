import { takeLatest, put, call } from 'redux-saga/effects'

import  * as types from '../constants/ActionTypes'
import SettingsService from '../services/settings/SettingsService'
import { getAdapter } from '../services/database'

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
  }
  yield put({type: types.RECEIVE_SETTINGS_FINISHED})
}

function* saveSettings(action: any) {
  const adapter = getAdapter()
  const settingsService = new SettingsService(new adapter())
  yield call(settingsService.save, 'settings', action.settingsPayload)

  yield put({type: types.SETTINGS_SAVED_SUCCESSFULLY})
  yield put({type: types.RECEIVE_SETTINGS, settings: action.settingsPayload})
  yield put({type: types.SEND_NOTIFICATION, notification: 'notifications.settings.saved'})
}

export function* deleteSettings(): any {
  try {
    const adapter = getAdapter()
    const settingsService  = new SettingsService(new adapter())
    yield call(settingsService.removeAll)
    yield put({type: types.SEND_NOTIFICATION, notification: 'notifications.settings.deleted'})
  } catch (e) {
    yield put({type: types.SEND_NOTIFICATION, notification: 'notifications.settings.deleted_failed'})
    yield put({type: types.REMOVE_FROM_SETTINGS_REJECTED, message: e.message})
  }
}


// Binding actions to sagas
function* settingsSaga(): any {
  yield takeLatest(types.INITIALIZE_SETTINGS, initialize)
  yield takeLatest(types.SAVE_SETTINGS, saveSettings)
  yield takeLatest(types.DELETE_SETTINGS, deleteSettings)
}

export default settingsSaga
