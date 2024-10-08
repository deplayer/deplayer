import { takeLatest, put, call, select } from "redux-saga/effects";

import { getAdapter } from "../services/database";
import { getSettings } from "./selectors";
import DatabaseSyncService from "../services/database/DatabaseSyncService";
import * as types from "../constants/ActionTypes";

// Database sync setup routines
function* setupSync(dispatch: any): Generator<any, void, any> {
  const adapter = getAdapter();
  const databaseSyncService = new DatabaseSyncService(adapter);
  const settings = yield select(getSettings);

  if (settings.app.databaseSync.enabled) {
    yield put({ type: types.SETTING_UP_DATABASE_SYNC_STARTED });

    const sync = yield call(databaseSyncService.setupSync, settings, dispatch);

    yield put({ type: types.SETUP_DATABASE_SYNC_FINISHED, sync: sync });
  }
}

// Binding actions to sagas
function* databaseSync(store: any): any {
  yield takeLatest(types.RECEIVE_SETTINGS_FINISHED, setupSync, store.dispatch);
}

export default databaseSync;
