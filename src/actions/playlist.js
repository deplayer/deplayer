// @flow

import { Dispatch } from 'redux'

import * as types from '../constants/ActionTypes'

import Song from '../entities/Song'

export const setCurrentPlaying = (song: Song) => {
  return function (dispatch: Dispatch) {
    dispatch({type: 'SET_CURRENT_PLAYING', song})
  }
}

export const addToPlaylist = (song: Song) => {
  return function (dispatch: Dispatch) {
    dispatch({type: types.ADD_TO_PLAYLIST, song})
  }
}
