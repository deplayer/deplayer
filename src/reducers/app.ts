import * as types from '../constants/ActionTypes'

type State = {
  sidebarToggled: Boolean,
  mqlMatch: Boolean,
  loading: Boolean,
  version: string
}

export const defaultState = {
  sidebarToggled: false,
  mqlMatch: false,
  loading: true,
  version: process.env.REACT_APP_VERSION || 'development'
}

export default (state: State = defaultState, action) => {
  switch (action.type) {
    case types.TOGGLE_SIDEBAR: {
      return {...state, sidebarToggled: action.value ? action.value :!state.sidebarToggled}
    }

    case types.SET_MQL: {
      return {...state, mqlMatch: action.value}
    }

    case types.INITIALIZED: {
      return {...state, loading: false}
    }

    case types.START_SEARCH: {
      return {
        ...state,
        loading: true
      }
    }

    case types.ADD_TO_COLLECTION:
    case types.RECEIVE_COLLECTION_FINISHED: {
      return {
        ...state,
        loading: false
      }
    }

    default:
      return state
  }
}
