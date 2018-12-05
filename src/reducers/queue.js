// @flow

import { Action } from 'redux'

import * as types from '../constants/ActionTypes'
import {
  populateTracks,
  getSiblingSong
} from './utils/queues'

type State = {
  trackIds: Array<string>,
  currentPlaying: any
}

export const defaultState = {
  trackIds: [],
  currentPlaying: null,
  nextSongId: null,
  prevSongId: null
}

export default (state: State = defaultState, action: Action = {}): State => {
  switch (action.type) {

    case types.ADD_TO_QUEUE:
      const mergedTrackIds = [...state.trackIds, ...populateTracks([action.song])]
      return {
        ...state,
        trackIds: mergedTrackIds
      }

    case types.ADD_SONGS_TO_QUEUE:
      const tracks = [...state.trackIds, ...populateTracks(action.songs)]
      return {
        ...state,
        trackIds: tracks
      }

    case types.SET_CURRENT_PLAYING:
      const scTracks = state.trackIds.includes(action.song)
        ? state.trackIds
        : [...state.trackIds, action.song]
      return {
        ...state,
        trackIds: scTracks,
        currentPlaying: action.song,
        prevSongId: getSiblingSong(scTracks, action.song),
        nextSongId: getSiblingSong(scTracks, action.song, true),
      }

    default:
      return state
  }
}
