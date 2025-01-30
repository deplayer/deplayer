import * as types from "../constants/ActionTypes";
import SettingsBuilder from "../services/settings/SettingsBuilder";
import providerBuilders from "../services/settings/providers";

export type ProviderSettings = {
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
    },
  },
};

// Helper to get next available provider ID
const getNextProviderId = (providers: State['settings']['providers'], baseKey: string) => {
  const existingKeys = Object.keys(providers)
    .filter(key => key.startsWith(baseKey))
    .map(key => {
      const num = key.replace(baseKey, '');
      return num ? parseInt(num, 10) : 0;
    })
    .sort((a, b) => a - b);

  const nextNum = existingKeys.length > 0 ? existingKeys[existingKeys.length - 1] + 1 : 0;
  return `${baseKey}${nextNum}`;
};

export default (state: State = defaultState, action: any = {}) => {
  switch (action.type) {
    case types.RECEIVE_SETTINGS:
    case types.SETTINGS_SAVED_SUCCESSFULLY: {
      const settingsForm = settingsBuilder.getFormSchema(
        action.settings?.providers || state.settings.providers
      );

      return {
        ...state,
        settingsForm,
        settings: action.settings || state.settings,
      };
    }

    case types.ADD_PROVIDER: {
      const providerBuilder = providerBuilders[action.providerKey];
      if (!providerBuilder) {
        return state;
      }

      // For non-repeatable providers, use the base key
      const providerId = providerBuilder.isRepeatable ? 
        getNextProviderId(state.settings.providers, action.providerKey) : 
        action.providerKey;
      
      const settings = {
        ...state.settings,
        providers: {
          ...state.settings.providers,
          [providerId]: {
            enabled: false
          }
        }
      };

      const settingsForm = settingsBuilder.getFormSchema(settings.providers);

      return {
        ...state,
        settingsForm,
        settings
      };
    }

    case types.REMOVE_PROVIDER: {
      // Create new objects to avoid mutation
      const newProviders = { ...state.settingsForm.providers };
      delete newProviders[action.providerKey];

      const newSettings = {
        ...state.settings,
        providers: {
          ...state.settings.providers
        }
      };
      delete newSettings.providers[action.providerKey];

      const settingsForm = settingsBuilder.getFormSchema(newSettings.providers);

      return {
        ...state,
        settingsForm,
        settings: newSettings
      };
    }

    default:
      return state;
  }
};
