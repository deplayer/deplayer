import { takeLatest, put, call, select } from 'redux-saga/effects'
import  * as types from '../constants/ActionTypes'
import { getAdapter } from '../services/database'
import DatabaseSyncService from '../services/database/DatabaseSyncService'
import { State as SettingsState }  from '../reducers/settings'

const getSettings = (state: any): SettingsState => {
  return state ? state.settings : {}
}

// Database sync setup routines
function* setupSync() {
  const adapter = getAdapter()
  const databaseSyncService = new DatabaseSyncService(new adapter())
  const { settings } = yield select(getSettings)

  if (settings.app.databaseSync.enabled) {
    yield put({type: types.SETTING_UP_DATABASE_SYNC_STARTED})

    const sync = yield call(databaseSyncService.setupSync, settings)

    yield put({type: types.SETUP_DATABASE_SYNC_FINISHED, sync: sync})
  }
}

// Binding actions to sagas
function* databaseSync(): any {
  yield takeLatest(types.RECEIVE_SETTINGS_FINISHED, setupSync)
}

export default databaseSync
