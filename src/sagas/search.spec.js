// @flow

import { expectSaga } from 'redux-saga-test-plan'

import {
  START_SEARCH,
  SEARCH_FULLFILLED,
  ADD_TO_COLLECTION,
  ADD_SONGS_TO_PLAYLIST
} from '../constants/ActionTypes'

import { search, getSettings } from './search'

describe('search saga', () => {
  it('should handle search events', () => {

    return expectSaga(search, {type: START_SEARCH, searchTerm: 'Metallica'})
      .put({type: SEARCH_FULLFILLED, searchResults: [ ] })
      .put({type: ADD_TO_COLLECTION, data: [ ] })
      .put({type: ADD_SONGS_TO_PLAYLIST, songs: [ ] })
      .run()
  })
})
