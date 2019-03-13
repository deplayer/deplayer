import reducer, { defaultState } from './search'
import {
  START_SEARCH,
  SEARCH_REJECTED,
  SEARCH_FULLFILLED
} from '../constants/ActionTypes'

describe('search reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual(defaultState)
  })

  it('should handle START_SEARCH', () => {
    expect(reducer({error: '', searchTerm: 'Lorem', loading: false, searchToggled: false}, {type: START_SEARCH, searchTerm: 'Lorem'}))
      .toEqual({loading: true, error: '', searchTerm: 'Lorem', searchToggled: false})
  })
  it('should handle SEARCH_REJECTED', () => {
    expect(reducer({error: '', searchTerm: '', loading: true, searchToggled: false}, {type: SEARCH_REJECTED, message: 'Testing error'}))
      .toEqual({loading: false, error: 'Testing error', searchTerm: '', searchToggled: false})
  })
  it('should handle SEARCH_FULLFILLED', () => {
    expect(reducer({error: 'whatever', searchTerm: '', loading: true, searchToggled: false}, {type: SEARCH_FULLFILLED}))
      .toEqual({loading: false, error: '', searchTerm: '', searchToggled: false})
  })
})


