import { getAdapter } from '../../services/database'
import SettingsService from '../../services/settings/SettingsService'
import { initializeSettings, defaultSettings } from './settingsStore'

// Type for the store from useStore hook
type LiveStore = ReturnType<typeof import('@livestore/react').useStore>['store']

const SETTINGS_ID = 'settings'
const MIGRATION_KEY = 'livestore-settings-migrated'

/**
 * Migrates settings from PGlite database to LiveStore
 * This should be called once on app initialization
 */
export const migrateSettingsToLiveStore = async (store: LiveStore) => {
  // Check if migration has already been completed
  const migrationCompleted = localStorage.getItem(MIGRATION_KEY)
  if (migrationCompleted === 'true') {
    return
  }

  try {
    // Try to read settings from PGlite
    try {
      const adapter = getAdapter()
      const settingsService = new SettingsService(adapter)
      const pgliteSettings = await settingsService.get(SETTINGS_ID)

      if (pgliteSettings && Array.isArray(pgliteSettings) && pgliteSettings.length > 0) {
        const settingsData = pgliteSettings[0].settings

        // Migrate to LiveStore
        store.commit(initializeSettings(SETTINGS_ID, settingsData))
        
        console.log('Settings migrated from PGlite to LiveStore')
      } else {
        // No settings in PGlite, initialize with defaults
        store.commit(initializeSettings(SETTINGS_ID, defaultSettings))
        console.log('Initialized LiveStore settings with defaults')
      }
    } catch (error) {
      // If PGlite read fails, initialize with defaults
      console.warn('Failed to read settings from PGlite, using defaults:', error)
      store.commit(initializeSettings(SETTINGS_ID, defaultSettings))
    }

    // Mark migration as complete
    localStorage.setItem(MIGRATION_KEY, 'true')
  } catch (error) {
    console.error('Error during settings migration:', error)
    // Initialize with defaults as fallback
    try {
      store.commit(initializeSettings(SETTINGS_ID, defaultSettings))
      localStorage.setItem(MIGRATION_KEY, 'true')
    } catch (fallbackError) {
      console.error('Failed to initialize default settings:', fallbackError)
    }
  }
}

/**
 * Reset migration flag (useful for testing or re-migration)
 */
export const resetMigrationFlag = () => {
  localStorage.removeItem(MIGRATION_KEY)
}

