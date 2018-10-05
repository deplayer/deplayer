// @flow

import reducer from './playlist'
import Song from '../entities/Song'

import {
  START_PLAYING,
  ADD_TO_PLAYLIST
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

  it('should handle ADD_COLLECTION_TO_PLAYLIST action', () => {
    const songs = []
    for (let i = 0; i < 20; i++) {
      songs.push(new Song({id: i}))
    }
    expect(reducer(undefined, {type: ADD_COLLECTION_TO_PLAYLIST, collection: songs}))
      .toEqual({
        tracks: {},
        currentPlaying: {},
        playing: false,
      })
  })
})
