import * as types from '../constants/ActionTypes'

type State = {
  sidebarToggled: Boolean
}

export const defaultState = {
  sidebarToggled: false
}

export default (state: State = defaultState, action) => {
  switch (action.type) {
    case types.TOGGLE_SIDEBAR: {
      return {...state, sidebarToggled: action.value ? action.value :!state.sidebarToggled}
    }

    default:
      return state
  }
}
