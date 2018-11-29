// @flow

import reducer, {defaultState} from './queue'
import Song from '../entities/Song'

import {
  ADD_TO_QUEUE,
  ADD_SONGS_TO_QUEUE,
  SET_CURRENT_PLAYING
} from '../constants/ActionTypes'

describe('queue reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual({
        trackIds: [],
        currentPlaying: {}
      })
  })

  it('should handle ADD_TO_QUEUE action', () => {
    const songToAdd = new Song({id: '1234'})
    const currPlaying = {}
    currPlaying['1234'] = songToAdd
    expect(reducer(undefined, {type: ADD_TO_QUEUE, song: songToAdd}))
      .toEqual({
        trackIds: ['1234'],
        currentPlaying: {}
      })
  })

  it('should handle ADD_SONGS_TO_QUEUE action', () => {
    const songs = []
    const expectedObj = {}
    for (let i = 1; i <= 20; i++) {
      const song = new Song({id: i.toString()})
      songs.push(song)
      expectedObj[i] = song
    }

    const addSongsState = reducer(undefined, {
      type: ADD_SONGS_TO_QUEUE,
      songs
    })

    expect(addSongsState)
      .toEqual({
        trackIds: Object.keys(expectedObj),
        currentPlaying: {}
      })
  })

  it('should handle SET_CURRENT_PLAYING action', () => {
    const songToAdd = new Song({id: '1234'})
    const props = {...defaultState, trackIds: ['1234']}
    expect(reducer(props, {type: SET_CURRENT_PLAYING, song: songToAdd}))
      .toEqual({
        ...props,
        currentPlaying: songToAdd
      })
  })
})
