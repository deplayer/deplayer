import { useAppStore } from '../store'
import { queryDb } from '@livestore/livestore'
import { tables } from '../schema'

/**
 * Settings Query Hooks
 *
 * These hooks provide reactive access to application settings from LiveStore.
 * They automatically update when the underlying data changes.
 */

interface ProviderSettings {
  enabled: boolean;
  [key: string]: unknown;
}

interface AppSettings {
  spectrum: { enabled: boolean };
  lastfm: { enabled: boolean; apikey: string };
  language: { code: string; useSystemLanguage: boolean };
  notifications: { enabled: boolean };
  sync?: { enabled: boolean; serverUrl: string };
  [key: string]: unknown;
}

interface SettingsShape {
  providers: { [key: string]: ProviderSettings };
  app: AppSettings;
}

/**
 * Get application settings
 *
 * @example
 * ```tsx
 * const settings = useSettings()
 * if (!settings) return <div>Loading settings...</div>
 * return <div>Language: {settings.app.language?.code}</div>
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useSettings = (settingsId = 'default'): any => {
  const store = useAppStore()
  const result = store.useQuery(
    queryDb(
      tables.settings
        .select()
        .where('id', '=', settingsId)
        .limit(1)
    )
  )

  const settingsRecord = (result as unknown as Array<{ settings: SettingsShape }>)[0]
  return settingsRecord ? settingsRecord.settings : null
}

/**
 * Get a specific provider's settings
 * 
 * @example
 * ```tsx
 * const lastfmSettings = useProviderSettings('lastfm')
 * if (!lastfmSettings) return null
 * return <div>Last.fm: {lastfmSettings.enabled ? 'Enabled' : 'Disabled'}</div>
 * ```
 */
export const useProviderSettings = (providerId: string) => {
  const settings = useSettings()
  return settings?.providers?.[providerId] || null
}

/**
 * Get app-level settings
 * 
 * @example
 * ```tsx
 * const appSettings = useAppSettings()
 * return <div>Notifications: {appSettings?.notifications?.enabled ? 'On' : 'Off'}</div>
 * ```
 */
export const useAppSettings = () => {
  const settings = useSettings()
  return settings?.app || null
}

/**
 * Get language settings
 * 
 * @example
 * ```tsx
 * const language = useLanguageSettings()
 * return <div>Current language: {language?.code || 'en'}</div>
 * ```
 */
export const useLanguageSettings = () => {
  const appSettings = useAppSettings()
  return appSettings?.language || null
}

/**
 * Get sync settings
 * 
 * @example
 * ```tsx
 * const syncSettings = useSyncSettings()
 * return <div>Sync: {syncSettings?.enabled ? 'On' : 'Off'}</div>
 * ```
 */
export const useSyncSettings = () => {
  const appSettings = useAppSettings()
  return appSettings?.sync || null
}

/**
 * Get list of enabled provider names
 * 
 * @example
 * ```tsx
 * const enabledProviders = useEnabledProviders()
 * return <div>Enabled providers: {enabledProviders.join(', ')}</div>
 * ```
 */
export const useEnabledProviders = () => {
  const settings = useSettings()
  if (!settings?.providers) return []
  
  return Object.keys(settings.providers).filter(
    (key) => settings.providers[key]?.enabled === true
  )
}
