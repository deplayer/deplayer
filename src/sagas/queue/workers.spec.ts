import { describe, it } from 'vitest'
import { expectSaga } from 'redux-saga-test-plan'

import {
  initialize
} from './workers'
import * as types from '../../constants/ActionTypes'

describe('initialize', () => {
  it('works', () => {
    return expectSaga(initialize)
      .put({ type: types.RECEIVE_QUEUE, queue: {} })
      .run()
  })
})
