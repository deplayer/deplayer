// @flow

import reducer, {defaultState} from './queue'
import Song from '../entities/Song'

import * as types from '../constants/ActionTypes'

describe('queue reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual(defaultState)
  })

  it('should handle ADD_TO_QUEUE action', () => {
    expect(reducer(undefined, {type: types.ADD_TO_QUEUE, song: '1234'}))
      .toEqual({
        ...defaultState,
        trackIds: ['1234'],
      })
  })

  it('should handle ADD_SONGS_TO_QUEUE action', () => {
    const songs = []
    const expectedObj = {}
    for (let i = 1; i <= 20; i++) {
      const song = new Song({id: i.toString()})
      songs.push(song)
      expectedObj[i] = song
    }

    const addSongsState = reducer(undefined, {
      type: types.ADD_SONGS_TO_QUEUE,
      songs
    })

    expect(addSongsState)
      .toEqual({
        ...defaultState,
        trackIds: Object.keys(expectedObj),
      })
  })

  it('should handle SET_CURRENT_PLAYING action', () => {
    const trackIds = ['1234', '4321']
    const props = {...defaultState, trackIds}
    expect(reducer(props, {type: types.SET_CURRENT_PLAYING, song: '1234'}))
      .toEqual({
        ...props,
        trackIds,
        currentPlaying: '1234',
        prevSongId: undefined,
        nextSongId: '4321'
      })
  })
})
