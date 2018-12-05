// @flow

import { Dispatch } from 'redux'

import * as types from '../constants/ActionTypes'

import Song from '../entities/Song'


// Add song to playlist
export const addToPlaylist = (song: Song) =>
  (dispatch: Dispatch) => {
    return dispatch({type: types.ADD_TO_PLAYLIST, song})
  }

// Add songs to playlist
export const addSongsToPlaylist = (songs: Array<Song>) =>
  (dispatch: Dispatch) => {
    return dispatch({type: types.ADD_SONGS_TO_PLAYLIST, songs})
  }

