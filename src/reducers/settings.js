// @flow

import { Action } from 'redux'

import { RECEIVE_SETTINGS } from '../constants/ActionTypes'
import { IConfig } from '../interfaces/IConfig'

type State = {
  error: string,
  saving: boolean,
  settings: IConfig
}

const defaultState = {
  error: '',
  saving: false,
  settings: {}
}

export default (state: State = defaultState, action: Action = {}) => {
  switch (action.type) {
    case RECEIVE_SETTINGS: {
      return {...state, settings: action.settings}
    }
    default:
      return state
  }
}
