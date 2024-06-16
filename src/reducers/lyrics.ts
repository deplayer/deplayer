import * as types from '../constants/ActionTypes'

export type State = {
  lyrics?: string
}

export const defaultState = {
  lyrics: ''
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
