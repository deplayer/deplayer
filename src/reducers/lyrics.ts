import * as types from '../constants/ActionTypes'

export type State = {
  lyrics?: string
  error?: string
}

export const defaultState = {
  lyrics: '',
  error: ''
}

export default (state: State = defaultState, action: any): State => {
  switch (action.type) {
    case types.LYRICS_FOUND: {
      return { lyrics: action.data, error: '' }
    }

    case types.NO_LYRICS_FOUND: {
      return { lyrics: '', error: action.error || 'No lyrics found' }
    }

    case types.CLEAR_LYRICS: {
      return defaultState
    }

    default:
      return state
  }
}
