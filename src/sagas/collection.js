// @flow

import { takeLatest, put } from 'redux-saga/effects'

import Media from '../entities/Media'

import {
  ADD_ONE_TO_COLLECTION,
} from '../constants/ActionTypes'

// Handling setCurrentPlaying saga
export function* addToCollection(action: {media: Media}): Generator<void, void, void> {
}

// Binding actions to sagas
function* collectionSaga(): Generator<void, void, void> {
  yield takeLatest(ADD_ONE_TO_COLLECTION, addToCollection)
}

export default collectionSaga
