import { describe, it } from 'vitest'
import { expectSaga } from 'redux-saga-test-plan'

import {
  addToCollectionWatcher,
  initializeWatcher
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


describe('initializeWatcher', () => {
  it('works', () => {
    return expectSaga(initializeWatcher)
      .withState({ collection: { rows: { 1: {} } } })
      .dispatch({ type: types.INITIALIZE })
      .put({ type: types.RECEIVE_SETTINGS, settings: {} })
      .put({ type: types.INITIALIZED })
      .put({ type: types.APPLY_MOST_PLAYED_SORT })
      .run()
  })
})
