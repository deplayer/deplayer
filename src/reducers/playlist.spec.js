// @flow

import reducer from './playlist'
import Song from '../entities/Song'

import {
  START_PLAYING,
  ADD_TO_PLAYLIST,
  ADD_SONGS_TO_PLAYLIST,
  SET_CURRENT_PLAYING
} from '../constants/ActionTypes'

describe('collection reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual({
        currentPlaying: {},
        tracks: {},
        playing: false,
      })
  })

  it('should handle START_PLAYING action', () => {
    expect(reducer(undefined, {type: START_PLAYING}))
      .toEqual({
        currentPlaying: {},
        tracks: {},
        playing: true,
      })
  })

  it('should handle ADD_TO_PLAYLIST action', () => {
    const songToAdd = new Song({id: '1234'})
    const currPlaying = {}
    currPlaying['1234'] = songToAdd
    expect(reducer(undefined, {type: ADD_TO_PLAYLIST, song: songToAdd}))
      .toEqual({
        tracks: currPlaying,
        currentPlaying: {},
        playing: false,
      })
  })

  it('should handle ADD_SONGS_TO_PLAYLIST action', () => {
    const songs = []
    const expectedObj = {}
    for (let i = 1; i <= 20; i++) {
      const song = new Song({id: i.toString()})
      songs.push(song)
      expectedObj[i] = song
    }

    const addSongsState = reducer(undefined, {type: ADD_SONGS_TO_PLAYLIST, songs})

    expect(addSongsState)
      .toEqual({
        tracks: expectedObj,
        currentPlaying: {},
        playing: false,
      })

    const playingSong = expectedObj[5]

    // It should set prev and next songs Ids
    expect(reducer(addSongsState, {type: SET_CURRENT_PLAYING, song: playingSong}))
      .toEqual({
        tracks: expectedObj,
        currentPlaying: playingSong,
        prevSongId: '4',
        nextSongId: '6',
        playing: false,
      })
  })
})
