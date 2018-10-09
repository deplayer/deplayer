// @flow

import reducer from './playlist'
import Song from '../entities/Song'

import {
  START_PLAYING,
  ADD_TO_PLAYLIST,
  ADD_SONGS_TO_PLAYLIST,
  SET_CURRENT_PLAYING,
  SET_COLUMN_SORT
} from '../constants/ActionTypes'

describe('collection reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual({
        currentPlaying: {},
        playing: false,
        trackIds: [],
      })
  })

  it('should handle START_PLAYING action', () => {
    expect(reducer(undefined, {type: START_PLAYING}))
      .toEqual({
        currentPlaying: {},
        playing: true,
        trackIds: [],
      })
  })

  it('should handle ADD_TO_PLAYLIST action', () => {
    const songToAdd = new Song({id: '1234'})
    const currPlaying = {}
    currPlaying['1234'] = songToAdd
    expect(reducer(undefined, {type: ADD_TO_PLAYLIST, song: songToAdd}))
      .toEqual({
        currentPlaying: {},
        playing: false,
        trackIds: ['1234'],
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
        currentPlaying: {},
        playing: false,
        trackIds: Object.keys(expectedObj),
      })

    const playingSong = expectedObj[5]

    // It should set prev and next songs Ids
    expect(reducer(addSongsState, {type: SET_CURRENT_PLAYING, song: playingSong}))
      .toEqual({
        currentPlaying: playingSong,
        prevSongId: '4',
        nextSongId: '6',
        playing: false,
        trackIds: Object.keys(expectedObj),
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
    const sortedSongs = songs.sort((song1, song2) => {
      return song1.price.price - song2.price.price
    })

    const trackIds = []

    sortedSongs.forEach((song) => {
      trackIds.push(song.id)
    })

    expect(reducer(addSongsState, {type: SET_COLUMN_SORT, column: 'price', direction: 'ASC', songs: expectedObj}))
      .toEqual({
        trackIds: trackIds,
        currentPlaying: {},
        prevSongId: undefined,
        nextSongId: undefined,
        playing: false,
      })
  })
})
