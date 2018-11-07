// @flow

import { takeLatest, put } from 'redux-saga/effects'

import Media from '../entities/Media'
import CollectionService from '../services/CollectionService'
import { getAdapter } from '../services/adapters'

import {
  ADD_TO_COLLECTION,
} from '../constants/ActionTypes'

// Handling setCurrentPlaying saga
export function* addToCollection(action: {data: Array<Media>}): Generator<void, void, void> {
  const adapter = getAdapter()
  const collectionService = new CollectionService(new adapter())
  yield console.log(action.data)
}

// Binding actions to sagas
function* collectionSaga(): Generator<void, void, void> {
  yield takeLatest(ADD_TO_COLLECTION, addToCollection)
}

export default collectionSaga
