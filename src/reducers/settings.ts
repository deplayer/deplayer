// DEPRECATED: This file is kept only for type compatibility during migration
// Settings functionality has been migrated to LiveStore
// Components should use LiveStore hooks instead: useSettings()

import type { SettingsShape } from '../services/settings/shape';

export type State = {
  error: string;
  saving: boolean;
  settings: SettingsShape;
};

export const defaultState: State = {
  error: "",
  saving: false,
  settings: {
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
        code: 'en',
        useSystemLanguage: true,
      },
      notifications: {
        enabled: true,
        showTrackChanges: true,
        showErrors: true,
      },
    },
  },
};
