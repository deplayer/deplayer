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
    providers: [
      {
        key: 'itunes',
        enabled: false
      },
      {
        key: 'mstream',
        enabled: false,
        baseUrl: '',
      },
      {
        key: 'subsonic',
        enabled: false,
        baseUrl: '',
        user: '',
        password: ''
      }
    ],
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

    default:
      return state
  }
}
