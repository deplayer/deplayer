import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'

import {
  deleteCollectionWorker,
  exportCollectionWorker,
  generateIndexWorker,
  importCollectionWorker,
  removeFromDbWorker,
  saveToDbWorker
} from './workers'
import IndexService from '../../services/Search/IndexService'
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

describe('importCollectionWorker', () => {
  it('works', () => {
    return expectSaga(importCollectionWorker, {type: 'TO_BE_FIXED', data: {}})
      .put({type: types.IMPORT_COLLECTION_FINISHED, result: {}})
      .run()
  })
})

describe('generateIndexWorker', () => {
  const service = new IndexService()
  const fakeIndex = {rows: {}}
  it('works', () => {
    return expectSaga(generateIndexWorker, service)
      .withState({ collection: {rows: {}} })
      .provide([
        [matchers.call.fn(service.generateIndexFrom), fakeIndex],
      ])
      .put({type: types.RECEIVE_SEARCH_INDEX, data: { rows: {} }})
      .run()
  })
})
