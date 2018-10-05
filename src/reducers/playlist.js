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

const populateTracks = (tracks, song) => {
  const songToAdd = []
  songToAdd[song.id] = song
  return {...tracks, ...songToAdd}
}

export default (state: State = defaultState, action: Action = {}): State => {
  switch (action.type) {

    case types.SET_CURRENT_PLAYING:
      return {...state, currentPlaying: action.song}

    case types.START_PLAYING:
      return {...state, playing: true}

    case types.ADD_TO_PLAYLIST:
      const tracks = populateTracks(state.tracks, action.song)
      return {...state, tracks}

    default:
      return state
  }
}
