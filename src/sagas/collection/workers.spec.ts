import { expectSaga } from 'redux-saga-test-plan'

import {
  saveToDbWorker,
  removeFromDbWorker,
  deleteCollectionWorker,
  exportCollectionWorker
} from './workers'
import * as types from '../../constants/ActionTypes'

describe('saveToDbWorker', () => {
  it('works', () => {
    const data = []
    return expectSaga(saveToDbWorker, data)
      .put({type: types.SAVE_COLLECTION_FULLFILLED})
      .run()
  })
})

describe('removeFromDbWorker', () => {
  it('works', () => {
    const action = { data: [] }
    return expectSaga(removeFromDbWorker, action)
      .put({type: types.REMOVE_FROM_COLLECTION_FULFILLED})
      .run()
  })
})

describe('deleteCollectionWorker', () => {
  it('works', () => {
    return expectSaga(deleteCollectionWorker)
      .put({type: types.REMOVE_FROM_COLLECTION_FULFILLED})
      .put({type: types.ADD_TO_COLLECTION, data: []})
      .put({type: types.SEND_NOTIFICATION, notification: 'notifications.collection_deleted'})
      .run()
  })
})

describe('exportCollectionWorker', () => {
  it('works', () => {
    return expectSaga(exportCollectionWorker)
      .put({type: types.EXPORT_COLLECTION_FINISHED, exported: {}})
      .run()
  })
})
