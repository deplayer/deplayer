import reducer, { defaultState } from './search'

import * as types from '../constants/ActionTypes'

describe('search reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual(defaultState)
  })

  it('should handle START_SEARCH', () => {
    expect(reducer({...defaultState, searchTerm: 'Lorem'}, {type: types.START_SEARCH, searchTerm: 'Lorem'}))
      .toEqual({...defaultState, loading: true, searchTerm: 'Lorem'})
  })
  it('should handle SEARCH_REJECTED', () => {
    expect(reducer({...defaultState, loading: true, searchToggled: false}, {type: types.SEARCH_REJECTED, message: 'Testing error'}))
      .toEqual({...defaultState, loading: false, error: 'Testing error', searchTerm: '', searchToggled: false})
  })
  it('should handle SEARCH_FINISHED', () => {
    expect(reducer({...defaultState, error: 'whatever', loading: true}, {type: types.SEARCH_FINISHED}))
      .toEqual({...defaultState, loading: false, error: '', searchTerm: '', searchToggled: false})
  })
})
