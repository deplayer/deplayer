// @flow

import { expectSaga } from 'redux-saga-test-plan'

import {
  START_PLAYING
} from '../constants/ActionTypes'
import Song from '../entities/Song'

import { sendCurrentPlayingNotification } from './notifications'

describe('notificaiton saga', () => {
  it('should handle player events', () => {
    const song = new Song()
    return expectSaga(sendCurrentPlayingNotification, {type: START_PLAYING, song})
      .run()
  })
})
