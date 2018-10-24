// @flow

import { Action } from 'redux'

import { RECEIVE_SETTINGS } from '../constants/ActionTypes'
import { ISettings } from '../interfaces/ISettings'

type State = {
  error: string,
  saving: boolean,
  settings: ISettings
}

export const defaultState = {
  error: '',
  saving: false,
  settings: {
    providers: {
      itunes: {
        enabled: false
      },
      mstream: {
        enabled: true,
        baseUrl: '',
      }
    }
  }
}

export default (state: State = defaultState, action: Action = {}) => {
  switch (action.type) {
    case RECEIVE_SETTINGS: {
      return {...state, settings: action.settings}
    }
      // case SETTINGS_SAVED_SUCCESSFULLY: {
      // }
    default:
      return state
  }
}
