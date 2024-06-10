import * as types from '../constants/ActionTypes'
import SettingsBuilder from '../services/settings/SettingsBuilder'

export type State = {
  error: string,
  saving: boolean,
  settings: any,
  settingsForm: {
    providers: any,
    fields: any
  }
}

const settingsBuilder = new SettingsBuilder()

export const defaultState = {
  error: '',
  saving: false,
  settingsForm: settingsBuilder.getFormSchema(),
  settings: {
    providers: {},
    app: {
      spectrum: {
        enabled: false
      },
      lastfm: {
        enabled: false,
        apikey: ''
      },
      databaseSync: {
        enabled: false,
        remote: ''
      },
      ipfs: {
        host: 'ipfs.io',
        port: 443,
        proto: 'https'
      },
      'youtube-dl-server': {
        host: 'http://localhost'
      }
    }
  }
}

export default (state: State = defaultState, action: any = {}) => {
  switch (action.type) {
    case types.RECEIVE_SETTINGS:
    case types.SETTINGS_SAVED_SUCCESSFULLY: {
      const settingsForm = settingsBuilder.getFormSchema(
        action.settings ? action.settings.providers : state.settings.providers
      )

      return {
        ...state,
        settingsForm,
        settings: action.settings
      }
    }

    case types.ADD_PROVIDER: {
      const { providers } = state.settingsForm
      providers[action.providerKey] = true

      const settingsForm = settingsBuilder.getFormSchema(providers)

      return {
        ...state,
        settingsForm
      }
    }

    case types.REMOVE_PROVIDER: {
      const { providers } = state.settingsForm
      delete providers[action.providerKey]

      const { settings } = state
      delete settings.providers[action.providerKey]

      const settingsForm = settingsBuilder.getFormSchema(providers)

      return {
        ...state,
        settingsForm
      }
    }

    case types.SET_CACHED_DATA: {
      return action.data.settings
    }

    default:
      return state
  }
}
