import { expectSaga } from 'redux-saga-test-plan'

import {
  ADD_TO_COLLECTION
} from '../constants/ActionTypes'

import Song from '../entities/Song'

import { addToCollection } from './collection'

describe('collection saga', () => {
  it('should handle collection additions', () => {
    const song = new Song()
    return expectSaga(addToCollection, {
      type: ADD_TO_COLLECTION,
      data: [song]
    })
      .run()
  })
})
