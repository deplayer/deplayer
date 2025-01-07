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
    const expectedTrackIds: string[] = []
    for (let i = 1; i <= 20; i++) {
      const song = new Media({ ...mediaParams, forcedId: i.toString() })
      songs.push(song)
      expectedTrackIds.push(i.toString())
    }

    const addSongsState = reducer(undefined, {
      type: types.ADD_SONGS_TO_QUEUE,
      songs: songs,
      replace: true
    })

    expect(addSongsState).toEqual({
      ...defaultState,
      trackIds: expectedTrackIds,
      randomTrackIds: [],
      currentPlaying: null,
      nextSongId: expectedTrackIds[0],
      prevSongId: null
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
    expect(reducer(props, { type: types.RECEIVE_QUEUE, queue: { ...props, trackIds: ['1234', '4321'] } }))
      .toEqual(props)
  })
})

describe('Queue Reducer', () => {
  const mockSongs = [
    { id: 'song1', title: 'Song 1' },
    { id: 'song2', title: 'Song 2' },
    { id: 'song3', title: 'Song 3' }
  ]

  describe('ADD_SONGS_TO_QUEUE', () => {
    it('should replace queue when replace is true', () => {
      const initialState = {
        ...defaultState,
        trackIds: ['old1', 'old2'],
        randomTrackIds: ['old2', 'old1'],
        currentPlaying: 'old1',
        nextSongId: 'old2',
        prevSongId: null
      }

      const result = reducer(initialState, {
        type: types.ADD_SONGS_TO_QUEUE,
        songs: mockSongs,
        replace: true
      })

      expect(result).toEqual({
        ...defaultState,
        trackIds: ['song1', 'song2', 'song3'],
        randomTrackIds: [],
        currentPlaying: null,
        nextSongId: 'song1',
        prevSongId: null
      })
    })

    it('should maintain shuffle state when replacing queue', () => {
      const initialState = {
        ...defaultState,
        trackIds: ['old1', 'old2'],
        randomTrackIds: ['old2', 'old1'],
        shuffle: true,
        currentPlaying: 'old1'
      }

      const result = reducer(initialState, {
        type: types.ADD_SONGS_TO_QUEUE,
        songs: mockSongs,
        replace: true
      })

      expect(result.shuffle).toBe(true)
      expect(result.randomTrackIds).toHaveLength(3)
      expect(result.randomTrackIds).toEqual(expect.arrayContaining(['song1', 'song2', 'song3']))
    })

    it('should append songs to queue when replace is false', () => {
      const initialState = {
        ...defaultState,
        trackIds: ['old1', 'old2'],
        currentPlaying: 'old1',
        nextSongId: 'old2'
      }

      const result = reducer(initialState, {
        type: types.ADD_SONGS_TO_QUEUE,
        songs: mockSongs,
        replace: false
      })

      expect(result.trackIds).toEqual(['old1', 'old2', 'song1', 'song2', 'song3'])
      expect(result.currentPlaying).toBe('old1')
      expect(result.nextSongId).toBe('old2')
    })

    it('should handle duplicate songs when appending', () => {
      const initialState = {
        ...defaultState,
        trackIds: ['song1', 'song2'],
        currentPlaying: 'song1',
        nextSongId: 'song2'
      }

      const result = reducer(initialState, {
        type: types.ADD_SONGS_TO_QUEUE,
        songs: mockSongs,
        replace: false
      })

      expect(result.trackIds).toEqual(['song1', 'song2', 'song3'])
      expect(result.currentPlaying).toBe('song1')
      expect(result.nextSongId).toBe('song2')
    })
  })
})