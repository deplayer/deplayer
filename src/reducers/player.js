// @flow

import * as types from '../constants/ActionTypes'
import { Action } from 'redux'
import {
  populateTracks,
  getSiblingSong
} from './utils/queues'

type State = {
  trackIds: Array<string>,
  playing: boolean,
  volume: number
}

export const defaultState = {
  trackIds: [],
  playing: false,
  volume: 100
}

export default (state: State = defaultState, action: Action = {}): State => {
  switch (action.type) {
    case types.START_PLAYING:
      return {...state, playing: true}

    case types.VOLUME_SET:
      return {...state, volume: action.value}

    case types.SET_CURRENT_PLAYING:
      const populatedTracks = populateTracks([action.song])
      const currTrackIds = state.trackIds.includes(populatedTracks[0]) ? state.trackIds : [...state.trackIds, ...populatedTracks]
      return {
        ...state,
        trackIds: currTrackIds,
        currentPlaying: action.song,
        prevSongId: getSiblingSong(state.trackIds, action.song),
        nextSongId: getSiblingSong(state.trackIds, action.song, true),
      }


    default:
      return state
  }
}
