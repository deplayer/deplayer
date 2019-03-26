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
    const songs: any = []
    const expectedObj = {}
    for (let i = 1; i <= 20; i++) {
      const song = new Song({forcedId: i.toString()})
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
    expect(reducer(props, {type: types.SET_CURRENT_PLAYING, songId: '1234'}))
      .toEqual({
        ...props,
        trackIds,
        currentPlaying: '1234',
        prevSongId: undefined,
        nextSongId: '4321'
      })
  })

  it('should handle PLAY_NEXT action', () => {
    const trackIds = ['1234', '4321']
    const props = {...defaultState, trackIds, currentPlaying: '1234', nextSongId: '4321'}
    expect(reducer(props, {type: types.PLAY_NEXT}))
      .toEqual({
        ...props,
        trackIds,
        currentPlaying: '4321',
        nextSongId: undefined,
        prevSongId: '1234'
      })
  })

  it('should handle PLAY_PREV action', () => {
    const trackIds = ['1234', '4321']
    const props = {
      ...defaultState,
      trackIds,
      currentPlaying: '1234',
      prevSongId: '4321'
    }
    expect(reducer(props, {type: types.PLAY_PREV}))
      .toEqual({
        ...props,
        trackIds,
        currentPlaying: '4321',
        nextSongId: undefined,
        prevSongId: '1234'
      })
  })

  it('should handle CLEAR_QUEUE action', () => {
    const trackIds = ['1234', '4321']
    const props = {...defaultState, trackIds}
    expect(reducer(props, {type: types.CLEAR_QUEUE, song: '1234'}))
      .toEqual(defaultState)
  })

  it('should handle SHUFFLE action', () => {
    const trackIds = ['1234', '4321', '3456', '2323']
    const props = {...defaultState, trackIds}
    const res = reducer(props, {type: types.SHUFFLE})
    expect(
      res.trackIds.map((id) => {
        return trackIds.map((sid) => {
          return sid === id
        })
      }).length !== 4
    ).toBe(false)
  })

  it('should handle RECEIVE_QUEUE', () => {
    const trackIds = ['1234', '4321']
    const props = {
      ...defaultState,
      trackIds,
      currentPlaying: '1234',
      prevSongId: '4321'
    }
    expect(reducer(props, {type: types.RECEIVE_QUEUE}))
    .toEqual(props)
  })
})
