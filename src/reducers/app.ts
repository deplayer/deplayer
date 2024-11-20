import * as types from '../constants/ActionTypes'

export type State = {
  backgroundImage: string,
  sidebarToggled: boolean,
  showAddMediaModal: boolean,
  mqlMatch: boolean,
  heightMqlMatch: boolean,
  loading: boolean,
  displayMiniQueue: boolean,
  version: string,
  showSpectrum: boolean,
  showVisuals: boolean,
  rightPanelToggled: boolean
}

export const defaultState = {
  backgroundImage: '',
  sidebarToggled: false,
  showAddMediaModal: false,
  mqlMatch: false,
  heightMqlMatch: false,
  loading: true,
  slimPlayer: false,
  displayMiniQueue: true,
  showSpectrum: false,
  showVisuals: false,
  version: import.meta.env.REACT_APP_VERSION || 'development',
  rightPanelToggled: false
}

export default (state: State = defaultState, action: any) => {
  switch (action.type) {
    case types.TOGGLE_SIDEBAR: {
      return { ...state, sidebarToggled: action.value ? action.value : !state.sidebarToggled }
    }

    case types.TOGGLE_RIGHT_PANEL: {
      return { ...state, rightPanelToggled: action.value ? action.value : !state.rightPanelToggled }
    }

    case types.TOGGLE_SPECTRUM: {
      return { ...state, showSpectrum: !state.showSpectrum }
    }
    case types.TOGGLE_VISUALS: {
      return { ...state, showVisuals: !state.showVisuals }
    }

    case types.SHOW_ADD_MEDIA_MODAL: {
      return { ...state, showAddMediaModal: true }
    }

    case types.HIDE_ADD_MEDIA_MODAL: {
      return { ...state, showAddMediaModal: false }
    }

    case types.SET_HEIGHT_MQL: {
      return {
        ...state,
        heightMqlMatch: action.value,
        slimRows: !action.value
      }
    }

    case types.SET_MQL: {
      return {
        ...state,
        mqlMatch: action.value,
        slimPlayer: !action.value
      }
    }

    case types.INITIALIZED: {
      return { ...state, loading: false }
    }

    case types.TOGGLE_MINI_QUEUE: {
      return { ...state, displayMiniQueue: !state.displayMiniQueue }
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
