import reducer, { defaultState } from './player'
import { describe, it, expect } from 'vitest'

import {
  START_PLAYING,
  VOLUME_SET,
  SET_CURRENT_TIME,
  STOP_PLAYING
} from '../constants/ActionTypes'

describe('collection reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, { type: STOP_PLAYING }))
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

  it('STOP_PLAYING clears streamUri to prevent dual-stream races', () => {
    const playing = { ...defaultState, playing: true, streamUri: 'http://song.mp3', showPlayer: true }
    const result = reducer(playing, { type: STOP_PLAYING })
    expect(result.playing).toBe(false)
    expect(result.streamUri).toBeNull()
  })
})
