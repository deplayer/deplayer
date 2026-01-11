// DEPRECATED: This file is kept only for type compatibility during migration
// Settings functionality has been migrated to LiveStore
// Components should use LiveStore hooks instead: useSettings()

import SettingsBuilder from "../services/settings/SettingsBuilder";

type ProviderSettings = {
  enabled: boolean;
  [key: string]: any;
};

export type State = {
  error: string;
  saving: boolean;
  settings: {
    providers: {
      [key: string]: ProviderSettings;
    };
    app: {
      spectrum: {
        enabled: boolean;
      };
      lastfm: {
        enabled: boolean;
        apikey: string;
      };
      language: {
        code: string;
        useSystemLanguage: boolean;
      };
      notifications: {
        enabled: boolean;
        showTrackChanges: boolean;
        showErrors: boolean;
      };
    };
  };
  settingsForm: {
    providers: {
      [key: string]: {
        fields: Array<{
          title: string;
          name?: string;
          type: string;
          showSync?: boolean;
        }>;
      };
    };
    fields: any;
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
