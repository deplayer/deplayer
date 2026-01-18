import { events } from './schema.js'
import { settings$ } from './queries.js'

// Stub type for removed sync settings
type SyncSettings = { enabled?: boolean; serverUrl?: string };

type SettingsRow = {
  id: string;
  settings: {
    providers: Record<string, unknown>;
    app: {
      language?: { useSystemLanguage?: boolean; code?: string };
      notifications?: { enabled?: boolean; showTrackChanges?: boolean; showErrors?: boolean };
      sync?: SyncSettings;
    };
  };
  createdAt: number;
  updatedAt: number;
} | null

// Default settings structure
export const defaultSettings = {
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
      apikey: '',
    },
    language: {
      code: 'en',
      useSystemLanguage: true,
    },
    notifications: {
      enabled: true,
      showTrackChanges: true,
      showErrors: true,
    },
  },
}

// Query to get settings
export const getSettingsQuery = settings$

// Helper to get settings data from query result
export const getSettingsData = (settingsRow: SettingsRow) => {
  if (!settingsRow) {
    return defaultSettings
  }
  return settingsRow.settings || defaultSettings
}

// Create update settings event
export const updateSettings = (id: string, settings: any) => {
  return events.settingsUpdated({ id, settings })
}

// Create initialize settings event
export const initializeSettings = (id: string, settings: any) => {
  return events.settingsInitialized({ id, settings })
}

