// @flow

import * as types from '../constants/ActionTypes'
import { Action } from 'redux'

type State = {
  error: string,
  loading: boolean
}

const defaultState = {
  error: '',
  loading: false
}

export default (state: State = defaultState, action: Action = {}) => {
  switch (action.type) {
    case types.START_SEARCH: {
      return {
        ...state,
        loading: true
      }
    }

    case types.SEARCH_REJECTED: {
      return {
        ...state,
        error: action.message,
        loading: false
      }
    }

    case types.SEARCH_FULLFILLED: {
      return {
        ...state,
        loading: false
      }
    }

    default:
      return state
  }
}
