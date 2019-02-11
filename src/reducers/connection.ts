import * as types from '../constants/ActionTypes'

type State = {
  connected: Boolean
}

export const defaultState = {
  connected: false
}

export default (state: State = defaultState, action) => {
  switch (action.type) {
    case types.SET_ONLINE_CONNECTION: {
      return {...state, connected: true}
    }

    default:
      return state
  }
}
