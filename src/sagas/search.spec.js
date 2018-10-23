// @flow

import { expectSaga } from 'redux-saga-test-plan'

import {
  START_SEARCH,
  SEARCH_FULLFILLED
} from '../constants/ActionTypes'

import { search } from './search'

describe('search saga', () => {
  it('should handle search events', () => {
    const config = {
      providers: {
        dummy: {
          enabled: true
        }
      }
    }

    return expectSaga(search, config, {type: START_SEARCH, searchTerm: 'Metallica'})
      .put({type: SEARCH_FULLFILLED, searchResults: [ { title: 'Highway to hell' } ] })
      .run()
  })
})
