import reducer, { defaultState } from './player'
import { describe, it, expect } from 'vitest'

import {
  START_PLAYING,
  VOLUME_SET,
  SET_CURRENT_TIME
} from '../constants/ActionTypes'

describe('collection reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, { type: '' }))
      .toEqual(defaultState)
  })

  it('should handle START_PLAYING action', () => {
    const expected = { ...defaultState, playing: true, showPlayer: true }
    expect(reducer(undefined, { type: START_PLAYING }))
      .toEqual(expected)
  })

  it('should handle VOLUME_SET action', () => {
    const expected = { ...defaultState, volume: 23 }
    expect(reducer(defaultState, { type: VOLUME_SET, value: 23 }))
      .toEqual(expected)
  })

  it('should handle SET_CURRENT_TIME action', () => {
    const expected = { ...defaultState, currentTime: 23 }
    expect(reducer(defaultState, { type: SET_CURRENT_TIME, value: 23 }))
      .toEqual(expected)
  })
})
