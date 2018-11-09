// @flow

import { takeLatest, put } from 'redux-saga/effects'

import Media from '../entities/Media'
import CollectionService from '../services/CollectionService'
import { getAdapter } from '../services/adapters'

import {
  ADD_TO_COLLECTION,
  RECEIVE_COLLECTION,
} from '../constants/ActionTypes'

// Handling ADD_TO_COLLECTION saga
function* addToCollection(action: any) {
  const adapter = getAdapter()
  const collectionService = new CollectionService(new adapter())
  const collection = yield collectionService.bulkSave(action.data)
  yield put({type: RECEIVE_COLLECTION, collection})
}

// Binding actions to sagas
function* collectionSaga(): Generator<void, void, void> {
  yield takeLatest(ADD_TO_COLLECTION, addToCollection)
}

export default collectionSaga
