// DEPRECATED: This file is kept only for type compatibility during migration
// Settings functionality has been migrated to LiveStore
// Components should use LiveStore hooks instead: useSettings()

import SettingsBuilder from "../services/settings/SettingsBuilder";
import type { FormField } from '../types/providers';

import type { SettingsShape } from '../services/settings/shape';

export type State = {
  error: string;
  saving: boolean;
  settings: SettingsShape;
  settingsForm: {
    providers: {
      [key: string]: {
        fields: FormField[];
      };
    };
    fields: FormField[];
  };
};

const settingsBuilder = new SettingsBuilder();

export const defaultState: State = {
  error: "",
  saving: false,
  settingsForm: settingsBuilder.getFormSchema(),
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
