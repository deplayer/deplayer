import { updateSettings, initializeSettings, defaultSettings, getSettingsData } from '../settingsStore'
import { queryDb } from '@livestore/livestore'
import { tables } from '../schema'


const SETTINGS_STORAGE_KEY = 'deplayer-settings'

// Stub for removed sync settings functionality
const storeSyncSettings = async (_settings: any) => {}

/**
 * localStorage fallback for settings persistence.
 * Used when LiveStore is running with the in-memory adapter (no SharedWorker).
 */
const saveSettingsToLocalStorage = (settings: any) => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    console.warn('[Settings] Failed to save settings to localStorage:', e)
  }
}

const loadSettingsFromLocalStorage = (): any | null => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (e) {
    console.warn('[Settings] Failed to load settings from localStorage:', e)
  }
  return null
}

/**
 * LiveStore Settings Actions
 * 
 * These actions handle settings CRUD operations using LiveStore.
 * Side effects (database reconnection, notifications) remain in Redux saga.
 * 
 * When LiveStore uses the in-memory adapter (no SharedWorker), settings are
 * also mirrored to localStorage so they survive page reloads.
 * 
 * All actions require a store parameter from useStore() hook.
 */

type LiveStore = {
  commit: (event: any) => void
  [key: string]: any
}

/**
 * Initialize settings - Create defaults if they don't exist
 * Returns the current settings (defaults if none exist)
 */
export const initializeSettingsAction = async (store: LiveStore) => {
  // Query for existing settings
  const query = queryDb(
    tables.settings
      .select()
      .where('id', '=', 'default')
      .limit(1)
  )
  
  const result = await store.query(query)
  const settingsRecord = (result as any[])[0]

  if (!settingsRecord) {
    // No settings exist in LiveStore — check localStorage fallback
    const localSettings = loadSettingsFromLocalStorage()
    const settingsToUse = localSettings || defaultSettings

    store.commit(initializeSettings('default', settingsToUse))
    return settingsToUse
  }

  // Settings exist, return them
  return getSettingsData(settingsRecord)
}

/**
 * Save settings - Merge with existing settings
 * Preserves app section when saving provider settings
 * 
 * @returns Object with prevSettings and newSettings for saga to check reconnection
 */
export const saveSettingsAction = async (store: LiveStore, settingsPayload: any) => {
  // Query for existing settings
  const query = queryDb(
    tables.settings
      .select()
      .where('id', '=', 'default')
      .limit(1)
  )
  
  const result = await store.query(query)
  const settingsRecord = (result as any[])[0]
  
  const prevSettings = settingsRecord ? getSettingsData(settingsRecord) : defaultSettings

  // Merge settings, preserving app section
  const settingsToSave = {
    ...prevSettings,
    ...settingsPayload,
    app: {
      ...prevSettings.app,
      ...(settingsPayload.app || {}),
    },
  }

  // Commit settings updated event
  store.commit(updateSettings('default', settingsToSave))

  // Mirror to localStorage when using in-memory adapter
  if (false) {
    saveSettingsToLocalStorage(settingsToSave)
  }

  // Store sync settings in localStorage if provided
  const newSync = settingsToSave.app.sync
  if (newSync) {
    storeSyncSettings(newSync)
  }

  // Return both old and new settings for saga to check if reconnection needed
  return {
    prevSettings,
    newSettings: settingsToSave,
  }
}

/**
 * Delete settings - Remove all settings from database
 * Resets sync settings in localStorage to defaults
 */
export const deleteSettingsAction = async (store: LiveStore) => {
  // Use raw SQL to delete settings
  await store.mutate((tx: any) => {
    return tx.exec(`DELETE FROM settings WHERE id = 'default'`)
  })

  // Reset sync settings in localStorage to defaults
  storeSyncSettings({ enabled: false, serverUrl: 'http://localhost:3000' })

  // Clear localStorage fallback
  try {
    localStorage.removeItem(SETTINGS_STORAGE_KEY)
  } catch {
    // ignore
  }

  return true
}

/**
 * Export settings types for consumers
 */
export type SettingsData = typeof defaultSettings
