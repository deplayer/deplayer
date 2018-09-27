// @flow

import * as types from '../constants/ActionTypes'
import { Action } from 'redux'

type State = {
  currentPlaying: any,
  tracks: any
}

const defaultState = {
  currentPlaying: {},
  tracks: {}
}

export default (state: State = defaultState, action: Action = {}): State => {
  switch (action.type) {

    case types.SET_CURRENT_PLAYING:
      return {...state, currentPlaying: action.song}

    case types.ADD_TO_PLAYLIST:
      state.tracks[action.song._id] = action.song
      return {...state}

    default:
      return state
  }
}
