import * as types from '../constants/ActionTypes'

export type State = {
  error: string,
  searchTerm: string,
  loading: boolean,
  searchIndex: object,
  searchToggled: boolean
}

export const defaultState = {
  error: '',
  searchTerm: '',
  loading: false,
  searchIndex: {},
  searchToggled: false
}

export default (state: State = defaultState, action: any = {}) => {
  switch (action.type) {
    case types.SET_SEARCH_TERM: {
      return {
        ...state,
        searchTerm: action.searchTerm
      }
    }

    case types.RECEIVE_SEARCH_INDEX: {
      return {
        ...state,
        searchIndex: action.data
      }
    }

    case types.TOGGLE_SEARCH_OFF: {
      return {
        ...state,
        searchToggled: false
      }
    }

    case types.TOGGLE_SEARCH: {
      return {
        ...state,
        searchToggled: !state.searchToggled
      }
    }

    case types.START_SEARCH: {
      return {
        ...state,
        searchTerm: action.searchTerm,
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

    case types.SEARCH_FINISHED: {
      return {
        ...state,
        error: '',
        loading: false
      }
    }

    case types.SET_CACHED_DATA: {
      return action.data.search
    }

    default:
      return state
  }
}
