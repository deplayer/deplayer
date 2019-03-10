import { Dispatch } from 'redux'

import * as types from '../constants/ActionTypes'

// Set song to be played in Player
export const setCurrentPlaying = (song: string) =>
  (dispatch: Dispatch) => {
    return dispatch({type: types.SET_CURRENT_PLAYING, song})
  }
