import { describe, it } from 'vitest'
import { expectSaga } from 'redux-saga-test-plan'

import {
  deleteCollectionWorker,
  exportCollectionWorker,
  importCollectionWorker,
  removeFromDbWorker,
  saveToDbWorker
} from './workers'
import * as types from '../../constants/ActionTypes'

describe('saveToDbWorker', () => {
  it('works', () => {
    const data = []
    return expectSaga(saveToDbWorker, data)
      .put({ type: types.SAVE_COLLECTION_FULLFILLED })
      .run()
  })
})

describe('removeFromDbWorker', () => {
  it('works', () => {
    const action = { data: [] }
    return expectSaga(removeFromDbWorker, action)
      .put({ type: types.REMOVE_FROM_COLLECTION_FULFILLED, data: [] })
      .put({ type: types.RECREATE_INDEX })
      .run()
  })
})

describe('deleteCollectionWorker', () => {
  it('works', () => {
    return expectSaga(deleteCollectionWorker)
      .put({ type: types.REMOVE_FROM_COLLECTION_FULFILLED })
      .put({ type: types.CLEAR_COLLECTION })
      .put({ type: types.CLEAR_QUEUE })
      .put({ type: types.SEND_NOTIFICATION, notification: 'notifications.collection_deleted' })
      .run()
  })
})

describe('exportCollectionWorker', () => {
  it('works', () => {
    return expectSaga(exportCollectionWorker)
      .put({ type: types.EXPORT_COLLECTION_FINISHED, exported: {} })
      .run()
  })
})

describe('importCollectionWorker', () => {
  it('works', () => {
    return expectSaga(importCollectionWorker, { type: 'TO_BE_FIXED', data: {} })
      .put({ type: types.IMPORT_COLLECTION_FINISHED, result: {} })
      .run()
  })
})
