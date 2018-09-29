// @flow

import * as types from '../../constants/ActionTypes'
import { Action } from 'redux'

type State = {
  error: string
}

const defaultState = {
  error: ''
}

export default (state: State = defaultState, action: Action = {}) => {
  switch (action.type) {
    case types.SEARCH_REJECTED: {
      return {
        ...state,
        error: action.message
      }
    }

    default:
      return state
  }
}
