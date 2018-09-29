// @flow

import { Dispatch } from 'redux'

import * as types from '../constants/ActionTypes'

import Song from '../entities/Song'

// Set song to be played in Player
export const setCurrentPlaying = (song: Song) =>
  (dispatch: Dispatch) => {
    return dispatch({type: types.SET_CURRENT_PLAYING, song})
  }

// Add song to playlist
export const addToPlaylist = (song: Song) =>
  (dispatch: Dispatch) => {
    return dispatch({type: types.ADD_TO_PLAYLIST, song})
  }
