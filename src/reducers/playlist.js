// @flow

import * as types from '../constants/ActionTypes'
import { Action } from 'redux'

import Song from '../entities/Song'

type State = {
  currentPlaying?: Song | any,
  tracks: any,
  playing: boolean
}

const defaultState = {
  currentPlaying: {},
  tracks: {},
  playing: false
}

export default (state: State = defaultState, action: Action = {}): State => {
  switch (action.type) {

    case types.SET_CURRENT_PLAYING:
      return {...state, currentPlaying: action.song}

    case types.START_PLAYING:
      return {...state, playing: true}

    case types.ADD_TO_PLAYLIST:
      state.tracks[action.song._id] = action.song
      return {...state}

    default:
      return state
  }
}
