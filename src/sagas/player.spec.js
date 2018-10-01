// @flow

import { expectSaga } from 'redux-saga-test-plan'

import {
  SET_CURRENT_PLAYING,
  START_PLAYING
} from '../constants/ActionTypes'
import Song from '../entities/Song'

import { setCurrentPlaying } from './player'

describe('player saga', () => {
  it('should handle player events', () => {
    const song = new Song()
    return expectSaga(setCurrentPlaying, {type: SET_CURRENT_PLAYING, song})
      .put.actionType(START_PLAYING)
      .run()
  })
})
