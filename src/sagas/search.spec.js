// @flow

import { expectSaga } from 'redux-saga-test-plan'

import {
  START_SEARCH,
  SEARCH_FULLFILLED
} from '../constants/ActionTypes'

import searchSaga from './search'

describe('search saga', () => {
  it('should handle search events', () => {
    return expectSaga(searchSaga, {type: START_SEARCH, searchTerm: 'Metallica'})
      .put({type: SEARCH_FULLFILLED, searchResults: [ { title: 'Highway to hell' } ] })
      .run()
  })
})
