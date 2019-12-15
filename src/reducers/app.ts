import * as types from '../constants/ActionTypes'

type State = {
  backgroundImage: string,
  sidebarToggled: boolean,
  showAddMediaModal: boolean,
  mqlMatch: boolean,
  loading: boolean,
  displayMiniQueue: boolean,
  version: string
}

export const defaultState = {
  backgroundImage: '',
  sidebarToggled: false,
  showAddMediaModal: false,
  mqlMatch: false,
  loading: true,
  slimPlayer: false,
  displayMiniQueue: true,
  version: process.env.REACT_APP_VERSION || 'development'
}

export default (state: State = defaultState, action: any) => {
  switch (action.type) {
    case types.TOGGLE_SIDEBAR: {
      return {...state, sidebarToggled: action.value ? action.value :!state.sidebarToggled}
    }

    case types.SHOW_ADD_MEDIA_MODAL: {
      return {...state, showAddMediaModal: true}
    }

    case types.HIDE_ADD_MEDIA_MODAL: {
      return {...state, showAddMediaModal: false}
    }


    case types.SET_MQL: {
      return {
        ...state,
        mqlMatch: action.value,
        slimPlayer: !action.value
      }
    }

    case types.INITIALIZED: {
      return {...state, loading: false}
    }

    case types.TOGGLE_MINI_QUEUE: {
      return {...state, displayMiniQueue: !state.displayMiniQueue}
    }

    case types.SET_BACKGROUND_IMAGE: {
      return {
        ...state,
        backgroundImage: action.backgroundImage
      }
    }

    default:
      return state
  }
}
