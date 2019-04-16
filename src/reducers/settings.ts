import * as types from '../constants/ActionTypes'
import { ISettings } from '../interfaces/ISettings'
import SettingsBuilder from '../services/settings/SettingsBuilder'

type State = {
  error: string,
  saving: boolean,
  settings: ISettings,
  settingsForm: any
}

const settingsBuilder = new SettingsBuilder()

export const defaultState = {
  error: '',
  saving: false,
  settingsForm: settingsBuilder.getFormSchema(),
  settings: {
    providers: [],
    app: {
      spectrum: {
        enabled: true
      }
    }
  }
}

export default (state: State = defaultState, action: any = {}) => {
  switch (action.type) {
    case types.RECEIVE_SETTINGS:
    case types.SETTINGS_SAVED_SUCCESSFULLY: {
      return {...state, settings: action.settings}
    }

    case types.ADD_PROVIDER: {
      const { settings } = state
      let providerAutoinc = 0
      for (let i = 0; i < settings.providers.length; i++) {
        if (settings.providers[i].key === action.providerId + '-' + i) {
          providerAutoinc++
        }
      }

      const newProvider = {key: action.providerId + '-' + providerAutoinc}
      return {...state, providers: [...state.settings.providers, newProvider]}
    }

    default:
      return state
  }
}
