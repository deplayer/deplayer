import * as types from '../constants/ActionTypes'

type State = {
  lyrics?: string
}

export const defaultState = {
  lyrics: null
}

export default (state: State = defaultState, action: any): State => {
  switch (action.type) {
    case types.LYRICS_FOUND: {
      return { lyrics: action.data }
    }

    default:
      return state
  }
}
