/**
 * Runtime settings shape — the single declaration of what a stored settings
 * blob contains. Consumed by the LiveStore hook (useSettings), the saga
 * selector (getSettingsFromLiveStore), and ProvidersService.
 *
 * The Settings UI registries (sections.ts, providers.ts) describe the FORM
 * for these same keys; they stay UI-only.
 */

export interface ProviderSettings {
  enabled: boolean
  /** Provider credentials (baseUrl, user, password, apiKey, ...). */
  [key: string]: unknown
}

/**
 * Known app sections are optional: stored blobs predate sections, and
 * absence must stay distinguishable from "explicitly disabled" — readers
 * decide their own defaults instead of trusting invented booleans.
 */
export interface AppSettings {
  spectrum?: { enabled: boolean }
  lastfm?: { enabled: boolean; apikey: string }
  language?: { code: string; useSystemLanguage: boolean }
  notifications?: { enabled: boolean; showTrackChanges: boolean; showErrors: boolean }
  sync?: { enabled: boolean; serverUrl: string }
  [key: string]: unknown
}

export interface SettingsShape {
  providers: Record<string, ProviderSettings>
  app: AppSettings
}

/** Absence-preserving empty settings — never invents false booleans. */
export const EMPTY_SETTINGS: SettingsShape = { providers: {}, app: {} }

/**
 * The one place a raw settings blob becomes SettingsShape. Stored rows are
 * JSON blobs; anything without the outer shape degrades to EMPTY_SETTINGS
 * rather than crashing readers.
 */
export function parseSettingsRow(raw: unknown): SettingsShape {
  if (raw !== null && typeof raw === 'object' && 'providers' in raw && 'app' in raw) {
    return raw as SettingsShape
  }
  return EMPTY_SETTINGS
}
