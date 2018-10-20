// @flow

import { Action } from 'redux'

type State = {
  error: string,
  saving: boolean
}

const defaultState = {
  error: '',
  saving: false
}

export default (state: State = defaultState, action: Action = {}) => {
  switch (action.type) {
    default:
      return state
  }
}
