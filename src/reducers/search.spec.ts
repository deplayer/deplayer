import reducer, { defaultState } from './search'
import { describe, it, expect } from 'vitest'

import * as types from '../constants/ActionTypes'

describe('search reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, { type: '' }))
      .toEqual(defaultState)
  })

  it('should handle START_SEARCH', () => {
    expect(reducer(defaultState, { type: types.START_SEARCH, searchTerm: 'Lorem' }))
      .toEqual({ ...defaultState, loading: true })
  })
  it('should handle SEARCH_REJECTED', () => {
    expect(reducer({ ...defaultState, loading: true }, { type: types.SEARCH_REJECTED, message: 'Testing error' }))
      .toEqual({ ...defaultState, loading: false, error: 'Testing error' })
  })
  it('should handle SEARCH_FINISHED', () => {
    expect(reducer({ ...defaultState, error: 'whatever', loading: true }, { type: types.SEARCH_FINISHED }))
      .toEqual({ ...defaultState, loading: false, error: '', searchResults: [] })
  })
  it('should handle SET_SEARCH_RESULTS', () => {
    expect(reducer(defaultState, { type: types.SET_SEARCH_RESULTS, searchResults: ['a', 'b'] }))
      .toEqual({ ...defaultState, searchResults: ['a', 'b'] })
  })
})
