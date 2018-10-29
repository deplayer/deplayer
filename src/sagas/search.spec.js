// @flow

import { expectSaga } from 'redux-saga-test-plan'

import {
  START_SEARCH,
  SEARCH_FULLFILLED,
  ADD_TO_COLLECTION,
  ADD_SONGS_TO_PLAYLIST
} from '../constants/ActionTypes'

import { search } from './search'

describe('search saga', () => {
  it('should handle search events', () => {

    return expectSaga(search, {type: START_SEARCH, searchTerm: 'Metallica'})
      .run()
  })
})
