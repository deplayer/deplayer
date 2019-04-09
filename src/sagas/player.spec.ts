import { expectSaga } from 'redux-saga-test-plan'

import * as types from '../constants/ActionTypes'
import Song from '../entities/Song'

import { setCurrentPlaying } from './player'

describe('player saga', () => {
  describe('START_PLAYING', () => {
    it('should handle player events', () => {
      const song = new Song()
      return expectSaga(setCurrentPlaying, {type: types.SET_CURRENT_PLAYING, songId: song.id})
        .put.actionType(types.START_PLAYING)
        .run()
    })
  })
  describe('PUSH_TO_VIEW', () => {
    it('should handle player events', () => {
      const song = new Song()
      return expectSaga(setCurrentPlaying, {type: types.PUSH_TO_VIEW, songId: song.id})
        .put.actionType(types.START_PLAYING)
        .run()
    })
  })
})
