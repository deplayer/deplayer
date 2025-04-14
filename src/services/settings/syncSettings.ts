const SYNC_SETTINGS_KEY = "deplayer_sync_settings";
const AUTH_TOKEN_KEY = "auth_token";

export type SyncSettings = {
  enabled: boolean;
  serverUrl: string;
};

const defaultSettings: SyncSettings = {
  enabled: false,
  serverUrl: "http://localhost:3000",
};

export const getStoredSyncSettings = (): SyncSettings => {
  const stored = localStorage.getItem(SYNC_SETTINGS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return { ...defaultSettings };
};

export const storeSyncSettings = (settings: SyncSettings) => {
  localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(settings));
};

const resetSyncSettings = () => {
  storeSyncSettings(defaultSettings);
  return defaultSettings;
};

/**
 * Store the authentication token
 */
export const storeAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

/**
 * Get the stored authentication token
 */
export const getAuthToken = (): string | undefined => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return token || undefined;
};

/**
 * Clear the authentication token
 */
const clearAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

// Form schema for sync settings
export const getSyncFormSchema = () => {
  const settings = getStoredSyncSettings();
  return {
    fields: [
      {
        title: "labels.enableSync",
        name: "enabled",
        type: "checkbox",
        value: settings.enabled,
      },
      {
        title: "labels.syncServerUrl",
        name: "serverUrl",
        type: "url",
        value: settings.serverUrl,
      },
    ],
  };
};
