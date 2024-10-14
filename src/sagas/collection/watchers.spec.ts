import { describe, it } from 'vitest'
import { expectSaga } from 'redux-saga-test-plan'

import {
  addToCollectionWatcher,
} from './watchers'
import * as types from '../../constants/ActionTypes'

describe('addToCollectionWatcher', () => {
  it('works', () => {
    return expectSaga(addToCollectionWatcher)
      .withState({ collection: { rows: {} } })
      .dispatch({ type: types.ADD_TO_COLLECTION, data: [] })
      .put({ type: types.RECEIVE_COLLECTION_FINISHED })
      .run()
  })
})

