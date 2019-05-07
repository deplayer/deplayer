import * as types from '../constants/ActionTypes'
import {
  sortTrackIds,
  populateTracks
} from './utils/queues'

type State = {
  trackIds: Array<string>,
  playlists: Array<any>
}

export const defaultState = {
  trackIds: [],
  currentPlaying: {},
  playlists: []
}

export default (state: State = defaultState, action: any = {}): State => {
  switch (action.type) {
    case types.ADD_TO_PLAYLIST:
      const mergedTrackIds = [...state.trackIds, ...populateTracks([action.song])]
      return {
        ...state,
        trackIds: mergedTrackIds
      }

    case types.ADD_SONGS_TO_PLAYLIST:
      const trackIds = populateTracks(action.songs)
      return {
        ...state,
        trackIds
      }

    case types.SET_COLUMN_SORT:
      return {...state, trackIds: sortTrackIds(action.songs, action.column)}

    case types.RECEIVE_PLAYLISTS:
      return {...state, playlists: action.playlists}

    default:
      return state
  }
}
