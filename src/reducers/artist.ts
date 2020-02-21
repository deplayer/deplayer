import * as types from '../constants/ActionTypes'

type State = {
  artistMetadata: any
}

export const defaultState = {
  artistMetadata: {}
}

export default (state: State = defaultState, action: any): State => {
  switch (action.type) {
    case types.RECEIVE_ARTIST_METADATA:
      return {...state, artistMetadata: action.data}

    case types.SET_CACHED_DATA: {
      return action.data.artist
    }

    default:
      return state
  }
}
