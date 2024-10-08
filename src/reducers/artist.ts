import * as types from '../constants/ActionTypes'

export type State = {
  artistMetadata: any
}

export const defaultState = {
  artistMetadata: {}
}

export default (state: State = defaultState, action: any): State => {
  switch (action.type) {
    case types.RECEIVE_ARTIST_METADATA:
      return { ...state, artistMetadata: action.data }

    default:
      return state
  }
}
