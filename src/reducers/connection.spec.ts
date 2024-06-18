import reducer from './connection'
import { describe, it, expect } from 'vitest'

import { defaultState } from './connection'
import * as types from '../constants/ActionTypes'

describe('connection reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, { type: '' }))
      .toEqual(defaultState)
  })

  it('should handle SET_ONLINE_CONNECTION', () => {
    const expected = { ...defaultState, connected: true }
    expect(reducer(undefined, { type: types.SET_ONLINE_CONNECTION }))
      .toEqual(expected)
  })

  it('should handle SET_OFFLINE_CONNECTION', () => {
    const expected = { ...defaultState, connected: false }
    expect(reducer(undefined, { type: types.SET_OFFLINE_CONNECTION }))
      .toEqual(expected)
  })
})
