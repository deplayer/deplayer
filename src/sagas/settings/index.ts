import { takeLatest, put, call, select } from "redux-saga/effects";

import * as types from "../../constants/ActionTypes";
import SettingsService from "../../services/settings/SettingsService";
import { getAdapter } from "../../services/database";
import { reconnect } from "../../services/database/PgliteDatabase";
import { storeSyncSettings } from "../../services/settings/syncSettings";
import { getSettings } from "../selectors";

// Application initialization routines
export function* initialize(): Generator<any, void, any> {
  const adapter = getAdapter();
  const settingsService = new SettingsService(adapter);
  yield call(settingsService.initialize);

  const defaultSettings = {
    providers: {
      musicbrainz: {
        enabled: true,
      },
    },
    app: {
      spectrum: {
        enabled: false,
      },
      lastfm: {
        enabled: false,
        apikey: "",
      },
      language: {
        code: "en",
        useSystemLanguage: true,
      },
    },
  };

  try {
    const settings = yield call(settingsService.get);

    if (!settings) {
      // Save default settings
      yield call(settingsService.save, "settings", defaultSettings);
      yield put({ type: types.RECEIVE_SETTINGS, settings: defaultSettings });
    } else {
      const unserialized = JSON.parse(JSON.stringify(settings));
      const settingsObj = unserialized[0].settings;

      // Ensure language settings exist
      if (!settingsObj.app?.language) {
        settingsObj.app = {
          ...settingsObj.app,
          language: defaultSettings.app.language,
        };
        // Save updated settings
        yield call(settingsService.save, "settings", settingsObj);
      }

      yield put({ type: types.RECEIVE_SETTINGS, settings: settingsObj });
    }
    yield put({ type: types.RECEIVE_SETTINGS_FINISHED });
  } catch (error: any) {
    yield put({ type: types.GET_SETTINGS_REJECTED, error: error.message });
  }
}

export function* saveSettings(action: any): Generator<any, void, any> {
  const adapter = getAdapter();
  const settingsService = new SettingsService(adapter);
  try {
    // Get previous settings to preserve app section if not provided
    const prevSettings = yield select(getSettings);
    const settingsToSave = {
      ...prevSettings,
      ...action.settingsPayload,
      app: {
        ...prevSettings.app,
        ...(action.settingsPayload.app || {}),
      },
    };

    const settings = yield call(
      settingsService.save,
      "settings",
      settingsToSave
    );

    // Get sync settings
    const newSync = settingsToSave.app.sync || {};

    // Store sync settings in localStorage
    if (newSync) {
      storeSyncSettings(newSync);
    }

    yield put({ type: types.SETTINGS_SAVED_SUCCESSFULLY, settings });
    yield put({ type: types.INITIALIZE, settings });
    yield put({
      type: types.SEND_NOTIFICATION,
      notification: "notifications.settings.saved",
    });

    // If sync settings changed, reconnect the database
    if (
      prevSettings.app?.sync?.enabled !== newSync.enabled ||
      prevSettings.app?.sync?.serverUrl !== newSync.serverUrl
    ) {
      yield call(reconnect);
    }
  } catch (e: any) {
    yield put({ type: types.SETTINGS_SAVED_REJECTED, error: e.message });
    yield put({
      type: types.SEND_NOTIFICATION,
      notification: "notifications.settings.error_saving",
      error: e.message,
    });
  }
}

export function* deleteSettings(): any {
  try {
    const adapter = getAdapter();
    const settingsService = new SettingsService(adapter);
    yield call(settingsService.removeAll);

    // Reset sync settings in localStorage to defaults
    storeSyncSettings({ enabled: false, serverUrl: "http://localhost:3000" });

    yield put({
      type: types.SEND_NOTIFICATION,
      notification: "notifications.settings.deleted",
    });

    // Reconnect database with default settings
    yield call(reconnect);
  } catch (e: any) {
    yield put({
      type: types.SEND_NOTIFICATION,
      notification: "notifications.settings.deleted_failed",
    });
    yield put({
      type: types.REMOVE_FROM_SETTINGS_REJECTED,
      message: e.message,
    });
  }
}

// Binding actions to sagas
function* settingsSaga(): any {
  yield takeLatest(types.INITIALIZE_SETTINGS, initialize);
  yield takeLatest(types.SAVE_SETTINGS, saveSettings);
  yield takeLatest(types.DELETE_SETTINGS, deleteSettings);
}

export default settingsSaga;
