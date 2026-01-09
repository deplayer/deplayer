import { Events, Schema } from '@livestore/livestore'

/**
 * Settings Domain Events
 * 
 * These events are already defined in schema.ts
 * Re-exporting here for consistency
 */

export const settingsEvents = {
  /**
   * Fired when settings are updated
   */
  settingsUpdated: Events.synced({
    name: 'v1.SettingsUpdated',
    schema: Schema.Struct({
      id: Schema.String,
      settings: Schema.Unknown,
    }),
  }),

  /**
   * Fired when settings are initialized for the first time
   */
  settingsInitialized: Events.synced({
    name: 'v1.SettingsInitialized',
    schema: Schema.Struct({
      id: Schema.String,
      settings: Schema.Unknown,
    }),
  }),
}
