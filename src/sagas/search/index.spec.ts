import { describe, it } from 'vitest'
import { expectSaga } from 'redux-saga-test-plan'

import { search } from './index'
import * as types from '../../constants/ActionTypes'

describe('search', () => {
  it('works', () => {
    const searchTerm = 'The Clash'
    const action = {
      type: types.START_SEARCH,
      searchTerm,
      noRedirect: false
    }
    return expectSaga(search, action)
      .put({ type: types.ADD_TO_COLLECTION, data: [] })
      .put({ type: types.SEARCH_FINISHED, searchTerm })
      .run()
  })
})
