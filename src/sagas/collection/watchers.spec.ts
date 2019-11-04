import { expectSaga } from 'redux-saga-test-plan'

import {
  addToCollectionWatcher,
  initializeWatcher
} from './watchers'
import * as types from '../../constants/ActionTypes'

describe('addToCollectionWatcher', () => {
  it('works', () => {
    return expectSaga(addToCollectionWatcher)
      .dispatch({ type: types.ADD_TO_COLLECTION, data: [] })
      .put({type: types.RECEIVE_COLLECTION_FINISHED})
      .run()
  })
})


describe('initializeWatcher', () => {
  it('works', () => {
    return expectSaga(initializeWatcher)
      .put({type: types.RECEIVE_COLLECTION, data: []})
      .put({type: types.INITIALIZED})
      .run()
  })
})
