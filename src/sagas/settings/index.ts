import { takeLatest, put, call } from 'redux-saga/effects'

import * as types from '../../constants/ActionTypes'
import SettingsService from '../../services/settings/SettingsService'
import { getAdapter } from '../../services/database'

// Application initialization routines
export function* initialize(): Generator<any, void, any> {
  const adapter = getAdapter()
  const settingsService = new SettingsService(adapter)
  yield call(settingsService.initialize)

  try {
    const settings = yield call(settingsService.get)

    if (!settings) {
      yield put({ type: types.GET_SETTINGS_REJECTED })
    } else {
      const unserialized = JSON.parse(JSON.stringify(settings))
      const settingsObj = unserialized[0].settings
      yield put({ type: types.RECEIVE_SETTINGS, settings: settingsObj })
    }
    yield put({ type: types.RECEIVE_SETTINGS_FINISHED })
  } catch {
    yield put({ type: types.GET_SETTINGS_REJECTED })
  }
}

function* saveSettings(action: any): Generator<any, void, any> {
  const adapter = getAdapter()
  const settingsService = new SettingsService(adapter)
  try {
    const settings = yield call(settingsService.save, 'settings', action.settingsPayload)

    yield put({ type: types.SETTINGS_SAVED_SUCCESSFULLY, settings })
    yield put({ type: types.INITIALIZE, settings })
    yield put({ type: types.SEND_NOTIFICATION, notification: 'notifications.settings.saved' })
  } catch (e: any) {
    yield put({ type: types.SETTINGS_SAVED_REJECTED, error: e.message })
    yield put({ type: types.SEND_NOTIFICATION, notification: 'notifications.settings.error_saving', error: e.message })
  }
}

export function* deleteSettings(): any {
  try {
    const adapter = getAdapter()
    const settingsService = new SettingsService(adapter)
    yield call(settingsService.removeAll)
    yield put({ type: types.SEND_NOTIFICATION, notification: 'notifications.settings.deleted' })
  } catch (e: any) {
    yield put({ type: types.SEND_NOTIFICATION, notification: 'notifications.settings.deleted_failed' })
    yield put({ type: types.REMOVE_FROM_SETTINGS_REJECTED, message: e.message })
  }
}

// Binding actions to sagas
function* settingsSaga(): any {
  yield takeLatest(types.INITIALIZE_SETTINGS, initialize)
  yield takeLatest(types.SAVE_SETTINGS, saveSettings)
  yield takeLatest(types.DELETE_SETTINGS, deleteSettings)
}

export default settingsSaga
