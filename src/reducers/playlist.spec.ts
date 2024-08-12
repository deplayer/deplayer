import reducer, { defaultState } from './playlist'
import { describe, it, expect } from 'vitest'
import Media from '../entities/Media'
import { mediaParams } from '../entities/Media.spec'
import { sortTrackIds } from './utils/queues'

import * as types from '../constants/ActionTypes'

describe('collection reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual(defaultState)
  })

  it('should handle ADD_TO_PLAYLIST action', () => {
    expect(reducer(undefined, { type: types.ADD_TO_PLAYLIST, songs: ['1234'] }))
      .toEqual({
        ...defaultState,
        trackIds: ['1234'],
        currentPlaying: {}
      })
  })

  it('should handle ADD_SONGS_TO_PLAYLIST action', () => {
    const songs: Array<Media> = []
    const expectedObj: { [key: number]: Media } = {}
    for (let i = 1; i <= 20; i++) {
      const song = new Media({ ...mediaParams, forcedId: i.toString() })
      songs.push(song)
      expectedObj[i] = song
    }

    const addSongsState = reducer(undefined, { type: types.ADD_SONGS_TO_PLAYLIST, songs: songs.map((song: Media) => song.id) })

    expect(addSongsState)
      .toEqual({
        ...defaultState,
        trackIds: Object.keys(expectedObj),
        currentPlaying: {}
      })
  })

  it('should handle SET_COLUMN_SORT action', () => {
    const songs: Array<Media> = []
    const expectedObj: { [key: number]: Media } = {}
    for (let i = 1; i <= 20; i++) {
      const song = new Media({ ...mediaParams, forcedId: i.toString() })
      songs.push(song)
      expectedObj[i] = song
    }

    const addSongsState = reducer(undefined, { type: types.ADD_SONGS_TO_PLAYLIST, songs: songs.map((song: Media) => song.id) })

    // It should set prev and next songs Ids
    const sortedSongsIds = sortTrackIds(expectedObj, 'price', 'ASC')

    expect(reducer(addSongsState, { type: types.SET_COLUMN_SORT, column: 'price', direction: 'ASC', songs: expectedObj }))
      .toEqual({
        ...defaultState,
        currentPlaying: {},
        trackIds: sortedSongsIds,
        prevSongId: undefined,
        nextSongId: undefined,
      })
  })

  it('should handle RECEIVE_PLAYLISTS action', () => {
    const playlist = { foo: 'bar' }

    expect(reducer(defaultState, { type: types.RECEIVE_PLAYLISTS, playlists: [playlist] }).playlists.length)
      .toBe(1)
  })
})
