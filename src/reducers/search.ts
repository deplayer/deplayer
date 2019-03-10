import * as types from '../constants/ActionTypes'

type State = {
  error: string,
  loading: boolean
}

export const defaultState = {
  error: '',
  searchTerm: '',
  loading: false
}

export default (state: State = defaultState, action: any = {}) => {
  switch (action.type) {
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

    case types.SEARCH_FULLFILLED: {
      return {
        ...state,
        error: '',
        loading: false
      }
    }

    default:
      return state
  }
}
