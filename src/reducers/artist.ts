import * as types from '../constants/ActionTypes'

export type ArtistMetadata = {
  'life-span'?: { begin?: string; end?: string; ended?: boolean }
  country?: string
  relations?: Array<{ type: string; url: { resource: string } }>
  artist?: { bio?: { content: string } }
  [key: string]: unknown
}

export type State = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  artistMetadata: Record<string, any>
}

export const defaultState = {
  artistMetadata: {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (state: State = defaultState, action: { type?: string; [key: string]: any }): State => {
  switch (action.type) {
    case types.RECEIVE_ARTIST_METADATA:
      return { ...state, artistMetadata: action.data as ArtistMetadata }

    case types.CLEAR_ARTIST_METADATA:
      return { ...state, artistMetadata: {} }

    default:
      return state
  }
}
