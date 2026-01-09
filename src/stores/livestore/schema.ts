import { Events, makeSchema, Schema, State } from '@livestore/livestore'

// Settings structure types
type ProviderSettings = {
  enabled: boolean;
  [key: string]: any;
};

type AppSettings = {
  spectrum?: {
    enabled: boolean;
  };
  lastfm?: {
    enabled: boolean;
    apikey: string;
  };
  language?: {
    code: string;
    useSystemLanguage: boolean;
  };
  notifications?: {
    enabled: boolean;
    showTrackChanges: boolean;
    showErrors: boolean;
  };
  sync?: {
    enabled: boolean;
    serverUrl: string;
    [key: string]: any;
  };
};

type SettingsData = {
  providers: {
    [key: string]: ProviderSettings;
  };
  app: AppSettings;
};

// SQLite table for settings
export const tables = {
  settings: State.SQLite.table({
    name: 'settings',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      settings: State.SQLite.json<SettingsData>({}),
      createdAt: State.SQLite.integer({}),
      updatedAt: State.SQLite.integer({}),
    },
  }),
}

// Events for settings changes
export const events = {
  settingsUpdated: Events.synced({
    name: 'v1.SettingsUpdated',
    schema: Schema.Struct({
      id: Schema.String,
      settings: Schema.Unknown,
    }),
  }),
  settingsInitialized: Events.synced({
    name: 'v1.SettingsInitialized',
    schema: Schema.Struct({
      id: Schema.String,
      settings: Schema.Unknown,
    }),
  }),
}

// Materializers map events to state
const materializers = State.SQLite.materializers(events, {
  'v1.SettingsUpdated': ({ id, settings }: { id: string; settings: any }) => {
    const now = Date.now()
    return tables.settings
      .insert({ id, settings, createdAt: now, updatedAt: now })
      .onConflict('id', 'update', { settings, updatedAt: now })
  },

  'v1.SettingsInitialized': ({ id, settings }: { id: string; settings: any }) => {
    const now = Date.now()
    return tables.settings
      .insert({ id, settings, createdAt: now, updatedAt: now })
      .onConflict('id', 'update', { settings, updatedAt: now })
  },
})

const state = State.SQLite.makeState({ tables, materializers })

export const schema = makeSchema({ events, state })

