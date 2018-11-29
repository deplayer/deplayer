// @flow

import { Action } from 'redux'

import * as types from '../constants/ActionTypes'
import {
  populateTracks
} from './utils/queues'

type State = {
  trackIds: Array<string>,
  currentPlaying: any
}

const defaultState = {
  trackIds: [],
  currentPlaying: {},
  nextSongId: undefined,
  prevSongId: undefined
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
      const trackIds = [...state.trackIds, ...populateTracks(action.songs)]
      return {
        ...state,
        trackIds
      }

    default:
      return state
  }
}
