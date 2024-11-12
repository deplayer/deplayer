import * as types from '../constants/ActionTypes'
import {
  sortTrackIds
} from './utils/queues'
import { SmartPlaylist } from '../types/SmartPlaylist'

export type State = {
  trackIds: Array<string>,
  playlists: Array<any>,
  smartPlaylists: Array<SmartPlaylist>
}

export const defaultState = {
  trackIds: [],
  currentPlaying: {},
  playlists: [],
  smartPlaylists: []
}

export default (state: State = defaultState, action: any = {}): State => {
  switch (action.type) {
    case types.ADD_TO_PLAYLIST:
      const mergedTrackIds = [...state.trackIds, ...action.songs]
      return {
        ...state,
        trackIds: mergedTrackIds
      }

    case types.ADD_SONGS_TO_PLAYLIST:
      const trackIds = action.songs
      return {
        ...state,
        trackIds
      }

    case types.SET_COLUMN_SORT:
      return { ...state, trackIds: sortTrackIds(action.songs, action.column) }

    case types.RECEIVE_PLAYLISTS:
      return { ...state, playlists: action.playlists }

    case types.SAVE_SMART_PLAYLIST:
      return {
        ...state,
        smartPlaylists: [...state.smartPlaylists, action.playlist]
      }

    case types.RECEIVE_SMART_PLAYLISTS:
      return {
        ...state,
        smartPlaylists: action.playlists
      }

    case types.DELETE_SMART_PLAYLIST:
      return {
        ...state,
        smartPlaylists: state.smartPlaylists.filter(p => p.id !== action.id)
      }

    default:
      return state
  }
}
