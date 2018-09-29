// @flow

import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import { SET_CURRENT_PLAYING } from '../constants/ActionTypes'
import Song from '../entities/Song'
import * as actions from './playlist'

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('actions/playlist', () => {
  it('should create an action to set current playing song', () => {
    const testSong = new Song()
    const expectedAction = {type: SET_CURRENT_PLAYING, song: testSong}

    const store = mockStore({})

    expect(store.dispatch(actions.setCurrentPlaying(testSong))).toEqual(expectedAction)
  })
})
