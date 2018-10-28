// @flow

import reducer, { sortTrackIds } from './playlist'
import Song from '../entities/Song'

import {
  ADD_TO_PLAYLIST,
  ADD_SONGS_TO_PLAYLIST,
  SET_COLUMN_SORT
} from '../constants/ActionTypes'

describe('collection reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual({
        trackIds: [],
        currentPlaying: {}
      })
  })

  it('should handle ADD_TO_PLAYLIST action', () => {
    const songToAdd = new Song({id: '1234'})
    const currPlaying = {}
    currPlaying['1234'] = songToAdd
    expect(reducer(undefined, {type: ADD_TO_PLAYLIST, song: songToAdd}))
      .toEqual({
        trackIds: ['1234'],
        currentPlaying: {}
      })
  })

  it('should handle ADD_SONGS_TO_PLAYLIST action', () => {
    const songs = []
    const expectedObj = {}
    for (let i = 1; i <= 20; i++) {
      const song = new Song({id: i.toString()})
      songs.push(song)
      expectedObj[i] = song
    }

    const addSongsState = reducer(undefined, {type: ADD_SONGS_TO_PLAYLIST, songs})

    expect(addSongsState)
      .toEqual({
        trackIds: Object.keys(expectedObj),
        currentPlaying: {}
      })
  })

  it('should handle SET_COLUMN_SORT action', () => {
    const songs = []
    const expectedObj = {}
    for (let i = 1; i <= 20; i++) {
      const song = new Song({id: i.toString(), price: {price: i%2}})
      songs.push(song)
      expectedObj[i] = song
    }

    const addSongsState = reducer(undefined, {type: ADD_SONGS_TO_PLAYLIST, songs})

    // It should set prev and next songs Ids
    const sortedSongsIds = sortTrackIds(expectedObj, 'price', 'ASC')

    expect(reducer(addSongsState, {type: SET_COLUMN_SORT, column: 'price', direction: 'ASC', songs: expectedObj}))
      .toEqual({
        currentPlaying: {},
        trackIds: sortedSongsIds,
        prevSongId: undefined,
        nextSongId: undefined,
      })
  })
})
