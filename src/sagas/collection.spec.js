// @flow

import { expectSaga } from 'redux-saga-test-plan'

import {
  ADD_ONE_TO_COLLECTION
} from '../constants/ActionTypes'

import Song from '../entities/Song'

import { addToCollection } from './collection'

describe('player saga', () => {
  it('should handle player events', () => {
    const song = new Song()
    return expectSaga(addToCollection, {type: ADD_ONE_TO_COLLECTION, song})
      .run()
  })
})
