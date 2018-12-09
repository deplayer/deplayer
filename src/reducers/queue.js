// @flow

import { Action } from 'redux'

import * as types from '../constants/ActionTypes'
import {
  populateTracks,
  getSiblingSong
} from './utils/queues'

type State = {
  trackIds: Array<string>,
  currentPlaying: any,
  nextSongId: null,
  prevSongId: null
}

export const defaultState = {
  trackIds: [],
  currentPlaying: null,
  nextSongId: null,
  prevSongId: null
}

const setCurrentPlaying = (state: any, action: any) => {
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
      return setCurrentPlaying(state, action)

    case types.PLAY_NEXT:
      if (state.nextSongId) {
        return setCurrentPlaying(state, {song: state.nextSongId})
      }

      return state

    case types.PLAY_PREV:
      if (state.prevSongId) {
        return setCurrentPlaying(state, {song: state.prevSongId})
      }

      return state

    default:
      return state
  }
}
