import * as types from '../constants/ActionTypes'

type State = {
  sidebarToggled: Boolean,
  mqlMatch: Boolean
}

export const defaultState = {
  sidebarToggled: false,
  mqlMatch: false
}

export default (state: State = defaultState, action) => {
  switch (action.type) {
    case types.TOGGLE_SIDEBAR: {
      return {...state, sidebarToggled: action.value ? action.value :!state.sidebarToggled}
    }

    case types.SET_MQL: {
      return {...state, mqlMatch: action.value}
    }

    default:
      return state
  }
}
