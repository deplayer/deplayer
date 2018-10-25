// @flow

import * as types from '../constants/ActionTypes'
import { Action } from 'redux'

import Song from '../entities/Song'

type State = {
  currentPlaying?: Song | any,
  nextSongId?: string,
  prevSongId?: string,
  trackIds: Array<string>,
  playing: boolean,
  volume: number
}

export const defaultState = {
  currentPlaying: {},
  nextSongId: undefined,
  prevSongId: undefined,
  trackIds: [],
  playing: false,
  volume: 100
}

// Get sibling songs ids to know which is the next and prev song
const getSiblingSong = (trackIds: Array<string>, song, next = false) => {
  const tracksIndex = {}
  const position = trackIds.indexOf(song.id)
  trackIds.forEach((trackId, index) => {
    tracksIndex[index] = trackId
  })

  if (next) {
    return tracksIndex[position+1]
  }

  return tracksIndex[position-1]
}

export default (state: State = defaultState, action: Action = {}): State => {
  switch (action.type) {

    case types.SET_CURRENT_PLAYING:
      return {
        ...state,
        currentPlaying: action.song,
        prevSongId: getSiblingSong(state.trackIds, action.song),
        nextSongId: getSiblingSong(state.trackIds, action.song, true),
      }

    case types.START_PLAYING:
      return {...state, playing: true}

    case types.VOLUME_SET:
      return {...state, volume: action.value}

    default:
      return state
  }
}
