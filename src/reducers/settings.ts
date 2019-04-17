import * as types from '../constants/ActionTypes'
import { ISettings } from '../interfaces/ISettings'
import SettingsBuilder from '../services/settings/SettingsBuilder'

type State = {
  error: string,
  saving: boolean,
  providers: Array<any>,
  settings: ISettings,
  settingsForm: any
}

const settingsBuilder = new SettingsBuilder()

export const defaultState = {
  error: '',
  saving: false,
  settingsForm: settingsBuilder.getFormSchema(),
  providers: [],
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
      const { providers } = state

      let providerAutoinc = 0
      for (let i = 0; i < providers.length; i++) {
        if (providers[i] && providers[i].key === action.providerId + '-' + i) {
          providerAutoinc++
        }
      }

      const settingsForm = settingsBuilder.getFormSchema()
      const newProvider = {key: action.providerId + '-' + providerAutoinc}
      const draftProviders = [...providers, newProvider]

      return {...state, settingsForm, providers: draftProviders}
    }

    default:
      return state
  }
}
