// @flow
import { Dispatch } from 'redux'

import * as types from '../constants/ActionTypes'

export const setCurrentPlaying = (song) => {
  return function (dispatch: Dispatch) {
    dispatch({type: 'SET_CURRENT_PLAYING', song})
  }
}

export const addToPlaylist = (song) => {
  return function (dispatch: Dispatch) {
    dispatch({type: types.ADD_TO_PLAYLIST, song})
  }
}
