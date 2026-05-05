import { events } from './schema.js'
import { settings$ } from './queries.js'


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
export const getSettingsData = (settingsRow: Record<string, unknown> | null) => {
  if (!settingsRow) {
    return defaultSettings
  }
  const row = settingsRow as unknown as { settings?: typeof defaultSettings }
  return row.settings || defaultSettings
}

// Create update settings event
export const updateSettings = (id: string, settings: Record<string, unknown>) => {
  return events.settingsUpdated({ id, settings })
}

// Create initialize settings event
export const initializeSettings = (id: string, settings: Record<string, unknown>) => {
  return events.settingsInitialized({ id, settings })
}

