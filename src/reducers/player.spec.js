// @flow

import reducer, { defaultState } from './player'
import Song from '../entities/Song'

import {
  START_PLAYING,
  VOLUME_SET,
  SET_CURRENT_PLAYING
} from '../constants/ActionTypes'

describe('collection reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual(defaultState)
  })

  it('should handle START_PLAYING action', () => {
    const expected = {...defaultState, playing: true}
    expect(reducer(undefined, {type: START_PLAYING}))
      .toEqual(expected)
  })

  it('should handle VOLUME_SET action', () => {
    const expected = {...defaultState, volume: 23}
    expect(reducer(defaultState, {type: VOLUME_SET, value: 23}))
      .toEqual(expected)
  })

  it('should handle SET_CURRENT_PLAYING action', () => {
    const songToAdd = new Song({id: '1234'})
    const currPlaying = {}
    expect(reducer({trackIds: ['1234']}, {type: SET_CURRENT_PLAYING, song: songToAdd}))
      .toEqual({
        trackIds: ['1234'],
        currentPlaying: songToAdd
      })
  })
})
