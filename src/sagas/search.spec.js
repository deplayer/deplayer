// @flow

import { expectSaga } from 'redux-saga-test-plan'

import {
  START_SEARCH,
  SEARCH_FULLFILLED
} from '../constants/ActionTypes'

import DummyRepository from '../repositories/DummyRepository'
import { search } from './search'

describe('search saga', () => {
  it('should handle search events', () => {
    const repository = new DummyRepository()

    expectSaga(search, repository, {type: START_SEARCH, searchTerm: 'Metallica'})
    // .put({type: SEARCH_FULLFILLED, searchResults: [] })
      .run()
  })
})
