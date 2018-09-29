// @flow

import { take } from 'redux-saga/effects'
import { expectSaga } from 'redux-saga-test-plan'

import DummyRepository from '../repositories/DummyRepository'
import { START_SEARCH, SEARCH_FULLFILLED } from '../constants/ActionTypes'
import { search } from './search'

describe('search saga', () => {
  it('should handle search events', () => {
    const repository = new DummyRepository()

    expectSaga(search, {type: START_SEARCH, searchTerm: 'Metallica'}, repository)
      .put({type: SEARCH_FULLFILLED, searchResults: [] })
      .run()
  })
})
