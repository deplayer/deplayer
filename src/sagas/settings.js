// @flow

import { takeLatest, put } from 'redux-saga/effects'

import  * as types from '../constants/ActionTypes'

function* saveSettings(action: any) {
  yield put({type: types.SETTINGS_SAVED_SUCCESSFULLY})
}

// Binding actions to sagas
function* settingsSaga(): Generator<void, void, void> {
  yield takeLatest(types.SETTINGS_SAVE, saveSettings)
}

export default settingsSaga
