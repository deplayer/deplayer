import reducer, { defaultState } from './queue'
import { describe, it, expect } from 'vitest'
import Media from '../entities/Media'
import { mediaParams } from '../entities/Media.spec'

import * as types from '../constants/ActionTypes'

describe('queue reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual(defaultState)
  })

  it('should handle ADD_TO_QUEUE not repeat ids', () => {
    expect(reducer({ ...defaultState, trackIds: ['1234'] }, { type: types.ADD_TO_QUEUE, songs: [{ id: '1234' }] }))
      .toEqual({
        ...defaultState,
        trackIds: ['1234'],
      })
  })

  it('should handle ADD_SONGS_TO_QUEUE action', () => {
    const songs: any = []
    const expectedObj: { [key: number]: Media } = {}
    for (let i = 1; i <= 20; i++) {
      const song = new Media({ ...mediaParams, forcedId: i.toString() })
      songs.push(song)
      expectedObj[i] = song
    }

    const addSongsState = reducer(undefined, {
      type: types.ADD_SONGS_TO_QUEUE,
      songs: songs.map((song: Media) => song.id)
    })

    expect(addSongsState)
      .toEqual({
        ...defaultState,
        trackIds: Object.keys(expectedObj),
      })
  })

  it('should handle SET_CURRENT_PLAYING action', () => {
    const trackIds = ['1234', '4321']
    const props = { ...defaultState, trackIds }
    expect(reducer(props, { type: types.SET_CURRENT_PLAYING, songId: '1234' }))
      .toEqual({
        ...props,
        trackIds,
        currentPlaying: '1234',
        prevSongId: undefined,
        nextSongId: '4321'
      })
  })

  it('should handle CLEAR_QUEUE action', () => {
    const trackIds = ['1234', '4321']
    const props = { ...defaultState, trackIds }
    expect(reducer(props, { type: types.CLEAR_QUEUE, song: '1234' }))
      .toEqual(defaultState)
  })

  it('should handle SHUFFLE action', () => {
    const trackIds = ['1234', '4321', '3456', '2323']
    const props = { ...defaultState, trackIds }
    const res = reducer(props, { type: types.SHUFFLE })
    expect(
      res.trackIds.map((id) => {
        return trackIds.map((sid) => {
          return sid === id
        })
      }).length !== 4
    ).toBe(false)

    expect(res.shuffle).toBe(true)
  })

  it('should handle RECEIVE_QUEUE', () => {
    const trackIds = ['1234', '4321']
    const props = {
      ...defaultState,
      trackIds,
      currentPlaying: '1234',
      prevSongId: '4321'
    }
    expect(reducer(props, { type: types.RECEIVE_QUEUE }))
      .toEqual(props)
  })
})
