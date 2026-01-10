import { takeLatest, put, call } from "redux-saga/effects";

import * as types from "../../constants/ActionTypes";
import SettingsService from "../../services/settings/SettingsService";
import { getAdapter } from "../../services/database";
import { reconnect } from "../../services/database/PgliteDatabase";

/**
 * Settings Saga - Side Effects Only
 * 
 * This saga now handles ONLY side effects (reconnection, notifications).
 * Settings data operations are handled by LiveStore actions.
 */

// Application initialization routines (still using PGlite for legacy support)
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
    const adapter = getAdapter();
    const settingsService = new SettingsService(adapter);
    yield call(settingsService.initialize);
    const settings = yield call(settingsService.get);

    if (!settings) {
      // Save default settings
      yield call(settingsService.save, "settings", defaultSettings);
      yield put({ type: types.RECEIVE_SETTINGS, settings: defaultSettings });
      yield put({ type: types.RECEIVE_SETTINGS_FINISHED });
      return;
    }

    const unserialized = JSON.parse(JSON.stringify(settings));

    if (unserialized.length === 0) {
      yield put({
        type: types.RECEIVE_SETTINGS,
        settings: defaultSettings,
      });
      yield put({ type: types.RECEIVE_SETTINGS_FINISHED });
      return;
    }

    const settingsObj = unserialized[0].settings;
    yield put({ type: types.RECEIVE_SETTINGS, settings: settingsObj });
    yield put({ type: types.RECEIVE_SETTINGS_FINISHED });
  } catch (error: any) {
    yield put({ type: types.GET_SETTINGS_REJECTED, error: error.message });
  }
}

/**
 * Handle settings saved - Side effects only
 * Triggered by SETTINGS_SAVED action from LiveStore
 */
export function* handleSettingsSaved(action: any): Generator<any, void, any> {
  try {
    const { prevSettings, newSettings } = action;

    // Get sync settings
    const prevSync = prevSettings.app?.sync || {};
    const newSync = newSettings.app?.sync || {};

    // If sync settings changed, reconnect the database
    if (
      prevSync.enabled !== newSync.enabled ||
      prevSync.serverUrl !== newSync.serverUrl
    ) {
      yield call(reconnect);
    }

    // Send success notification
    yield put({
      type: types.SEND_NOTIFICATION,
      notification: "notifications.settings.saved",
    });
    
    // Update Redux state for UI (during migration)
    yield put({ type: types.SETTINGS_SAVED_SUCCESSFULLY, settings: newSettings });
  } catch (e: any) {
    yield put({ type: types.SETTINGS_SAVED_REJECTED, error: e.message });
    yield put({
      type: types.SEND_NOTIFICATION,
      notification: "notifications.settings.error_saving",
      error: e.message,
    });
  }
}

/**
 * Handle settings deleted - Side effects only
 * Triggered by SETTINGS_DELETED action from LiveStore
 */
function* handleSettingsDeleted(): any {
  try {
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

// Legacy saga handlers (kept for backwards compatibility during migration)
export function* saveSettings(_action: any): Generator<any, void, any> {
  // This is now a no-op, kept for backwards compatibility
  // Settings are saved via LiveStore actions
  console.warn('Legacy SAVE_SETTINGS action - use LiveStore actions instead')
}

function* deleteSettings(): any {
  // This is now a no-op, kept for backwards compatibility
  // Settings are deleted via LiveStore actions
  console.warn('Legacy DELETE_SETTINGS action - use LiveStore actions instead')
}

// Binding actions to sagas
function* settingsSaga(): any {
  yield takeLatest(types.INITIALIZE_SETTINGS, initialize);
  yield takeLatest(types.SAVE_SETTINGS, saveSettings); // Legacy
  yield takeLatest(types.DELETE_SETTINGS, deleteSettings); // Legacy
  yield takeLatest(types.SETTINGS_SAVED, handleSettingsSaved); // New: LiveStore side effects
  yield takeLatest(types.SETTINGS_DELETED, handleSettingsDeleted); // New: LiveStore side effects
}

export default settingsSaga;
