// @flow

import { expectSaga } from 'redux-saga-test-plan'

import {
  PLAY_ALL
} from '../constants/ActionTypes'

import { playAll } from './queue'

describe('queue saga', () => {
  it('should handle queue events', () => {
    return expectSaga(playAll, {type: PLAY_ALL})
      .run()
  })
})
