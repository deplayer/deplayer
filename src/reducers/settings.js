// @flow

import { Action } from 'redux'

import { RECEIVE_SETTINGS } from '../constants/ActionTypes'

type State = {
  error: string,
  saving: boolean,
  settings: any
}

const defaultState = {
  error: '',
  saving: false,
  settings: {}
}

export default (state: State = defaultState, action: Action = {}) => {
  switch (action.type) {
    case RECEIVE_SETTINGS:
      return {...state, settings: action.settings}
    default:
      return state
  }
}
