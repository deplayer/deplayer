// @flow

import reducer, { defaultState } from './player'

import {
  START_PLAYING,
  VOLUME_SET
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
})
