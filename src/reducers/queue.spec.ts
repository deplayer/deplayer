import { describe, it, expect, vi } from 'vitest'
import * as types from '../constants/ActionTypes'
import { IMedia } from '../entities/Media'
import { QueueAction } from './queue/types'
import queue, { defaultState } from './queue'

// Create a mock Media factory
const createMockMedia = (id: string, title: string = 'Test Song'): IMedia => ({
  id,
  title,
  artist: {
    name: 'Test Artist',
    id: 'artist-1'
  },
  album: {
    id: 'album-1',
    name: 'Test Album',
    artist: { name: 'Test Artist', id: 'artist-1' },
    thumbnailUrl: 'test.jpg'
  },
  artistName: 'Test Artist',
  type: 'audio',
  duration: 180,
  stream: {},
  playCount: 0,
  genres: ['Rock'],
  albumName: 'Test Album',
  cover: { 
    thumbnailUrl: 'test.jpg', 
    fullUrl: 'test.jpg' 
  }
})

// Mock translations
vi.mock('react-redux-i18n', () => ({
  Translate: ({ value }: { value: string }) => value
}))

// Mock useNavigate and BrowserRouter
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('queue reducer', () => {
  it('should return the initial state', () => {
    expect(queue(undefined, { type: types.CLEAR_QUEUE }))
      .toEqual(defaultState)
  })

  it('should handle ADD_TO_QUEUE not repeat ids', () => {
    const mockMedia = createMockMedia('1234')
    expect(queue(
      { ...defaultState, trackIds: ['1234'] }, 
      { type: types.ADD_TO_QUEUE, songs: [mockMedia] }
    )).toEqual({
      ...defaultState,
      trackIds: ['1234'],
    })
  })

  it('should handle ADD_SONGS_TO_QUEUE action', () => {
    const songs: IMedia[] = []
    const expectedTrackIds: string[] = []
    for (let i = 1; i <= 20; i++) {
      const song = createMockMedia(i.toString())
      songs.push(song)
      expectedTrackIds.push(i.toString())
    }

    const addSongsState = queue(undefined, {
      type: types.ADD_SONGS_TO_QUEUE,
      songs,
      replace: true
    } as QueueAction)

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
    expect(queue(props, { type: types.SET_CURRENT_PLAYING, songId: '1234' }))
      .toEqual({
        ...props,
        trackIds,
        currentPlaying: '1234',
        prevSongId: null,
        nextSongId: '4321'
      })
  })

  it('should handle CLEAR_QUEUE action', () => {
    const trackIds = ['1234', '4321']
    const props = { ...defaultState, trackIds }
    expect(queue(props, { type: types.CLEAR_QUEUE }))
      .toEqual(defaultState)
  })

  it('should handle SHUFFLE action', () => {
    const trackIds = ['1234', '4321', '3456', '2323']
    const props = { ...defaultState, trackIds }
    const res = queue(props, { type: types.SHUFFLE })
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
    expect(queue(props, { type: types.RECEIVE_QUEUE, queue: { ...props, trackIds: ['1234', '4321'] } }))
      .toEqual(props)
  })

  describe('ADD_TO_QUEUE_NEXT', () => {
    it('should do nothing if no current playing song', () => {
      const initialState = {
        ...defaultState,
        trackIds: ['song1', 'song2']
      }

      const mockMedia = createMockMedia('song3')
      const result = queue(initialState, {
        type: types.ADD_TO_QUEUE_NEXT,
        songs: [mockMedia]
      })

      expect(result).toEqual(initialState)
    })

    it('should add songs after current playing song in normal mode', () => {
      const initialState = {
        ...defaultState,
        trackIds: ['song1', 'song2', 'song3'],
        currentPlaying: 'song2'
      }

      const mockMedia1 = createMockMedia('song4')
      const mockMedia2 = createMockMedia('song5')
      const result = queue(initialState, {
        type: types.ADD_TO_QUEUE_NEXT,
        songs: [mockMedia1, mockMedia2]
      })

      expect(result.trackIds).toEqual(['song1', 'song2', 'song4', 'song5', 'song3'])
      expect(result.nextSongId).toBe('song4')
      expect(result.prevSongId).toBe('song1')
    })

    it('should add songs after current playing song in shuffle mode', () => {
      const initialState = {
        ...defaultState,
        trackIds: ['song1', 'song2', 'song3'],
        randomTrackIds: ['song2', 'song3', 'song1'],
        currentPlaying: 'song2',
        shuffle: true
      }

      const mockMedia1 = createMockMedia('song4')
      const mockMedia2 = createMockMedia('song5')
      const result = queue(initialState, {
        type: types.ADD_TO_QUEUE_NEXT,
        songs: [mockMedia1, mockMedia2]
      })

      // Check both normal and random queues
      expect(result.trackIds).toEqual(['song1', 'song2', 'song4', 'song5', 'song3'])
      expect(result.randomTrackIds).toEqual(['song2', 'song4', 'song5', 'song3', 'song1'])
      expect(result.nextSongId).toBe('song4')
      expect(result.prevSongId).toBe(null)
    })

    it('should handle duplicate songs', () => {
      const initialState = {
        ...defaultState,
        trackIds: ['song1', 'song2', 'song3'],
        currentPlaying: 'song2'
      }

      const mockMedia1 = createMockMedia('song2')
      const mockMedia2 = createMockMedia('song4')
      const result = queue(initialState, {
        type: types.ADD_TO_QUEUE_NEXT,
        songs: [mockMedia1, mockMedia2]
      })

      expect(result.trackIds).toEqual(['song1', 'song2', 'song4', 'song3'])
      expect(result.nextSongId).toBe('song4')
      expect(result.prevSongId).toBe('song1')
    })
  })

  describe('REMOVE_FROM_QUEUE', () => {
    it('should handle removing a song', () => {
      const initialState = {
        ...defaultState,
        trackIds: ['song1', 'song2', 'song3']
      }

      const mockMedia = createMockMedia('song2')
      const result = queue(initialState, {
        type: types.REMOVE_FROM_QUEUE,
        song: mockMedia
      })

      expect(result.trackIds).toEqual(['song1', 'song3'])
    })

    it('should handle removing multiple songs', () => {
      const initialState = {
        ...defaultState,
        trackIds: ['song1', 'song2', 'song3']
      }

      const mockMedia1 = createMockMedia('song1')
      const mockMedia2 = createMockMedia('song2')
      const result = queue(initialState, {
        type: types.REMOVE_FROM_QUEUE,
        data: [mockMedia1, mockMedia2]
      })

      expect(result.trackIds).toEqual(['song3'])
    })

    it('should handle removing current playing song', () => {
      const initialState = {
        ...defaultState,
        trackIds: ['song1', 'song2', 'song3'],
        currentPlaying: 'song2'
      }

      const mockMedia = createMockMedia('song2')
      const result = queue(initialState, {
        type: types.REMOVE_FROM_QUEUE,
        song: mockMedia
      })

      expect(result.trackIds).toEqual(['song1', 'song3'])
      expect(result.currentPlaying).toBeNull()
    })

    it('should handle removing non-existent song', () => {
      const initialState = {
        ...defaultState,
        trackIds: ['song1', 'song2', 'song3']
      }

      const mockMedia = createMockMedia('nonexistent')
      const result = queue(initialState, {
        type: types.REMOVE_FROM_QUEUE,
        song: mockMedia
      })

      expect(result).toEqual(initialState)
    })
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

      const result = queue(initialState, {
        type: types.ADD_SONGS_TO_QUEUE,
        songs: mockSongs.map((song) => createMockMedia(song.id, song.title)),
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

      const result = queue(initialState, {
        type: types.ADD_SONGS_TO_QUEUE,
        songs: mockSongs.map((song) => createMockMedia(song.id, song.title)),
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

      const result = queue(initialState, {
        type: types.ADD_SONGS_TO_QUEUE,
        songs: mockSongs.map((song) => createMockMedia(song.id, song.title)),
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

      const result = queue(initialState, {
        type: types.ADD_SONGS_TO_QUEUE,
        songs: mockSongs.map((song) => createMockMedia(song.id, song.title)),
        replace: false
      })

      expect(result.trackIds).toEqual(['song1', 'song2', 'song3'])
      expect(result.currentPlaying).toBe('song1')
      expect(result.nextSongId).toBe('song2')
    })
  })

  describe('ADD_TO_QUEUE_NEXT', () => {
    it('should do nothing if no current playing song', () => {
      const initialState = {
        ...defaultState,
        trackIds: ['old1', 'old2']
      }

      const result = queue(initialState, {
        type: types.ADD_TO_QUEUE_NEXT,
        songs: mockSongs.map((song) => createMockMedia(song.id, song.title)),
      })

      expect(result).toEqual(initialState)
    })

    it('should add songs after current playing song in normal mode', () => {
      const initialState = {
        ...defaultState,
        trackIds: ['old1', 'old2', 'old3'],
        currentPlaying: 'old2'
      }

      const result = queue(initialState, {
        type: types.ADD_TO_QUEUE_NEXT,
        songs: mockSongs.map((song) => createMockMedia(song.id, song.title)),
      })

      expect(result.trackIds).toEqual(['old1', 'old2', 'song1', 'song2', 'song3', 'old3'])
      expect(result.nextSongId).toBe('song1')
      expect(result.prevSongId).toBe('old1')
    })

    it('should add songs after current playing song in shuffle mode', () => {
      const initialState = {
        ...defaultState,
        trackIds: ['old1', 'old2', 'old3'],
        randomTrackIds: ['old2', 'old3', 'old1'],
        currentPlaying: 'old2',
        shuffle: true
      }

      const result = queue(initialState, {
        type: types.ADD_TO_QUEUE_NEXT,
        songs: mockSongs.map((song) => createMockMedia(song.id, song.title)),
      })

      // Check that songs were added after current playing in random queue
      const currentIndex = result.randomTrackIds.indexOf('old2')
      const nextThreeSongs = result.randomTrackIds.slice(currentIndex + 1, currentIndex + 4)
      expect(nextThreeSongs).toEqual(['song1', 'song2', 'song3'])

      // Check that normal queue was also updated
      expect(result.trackIds).toContain('song1')
      expect(result.trackIds).toContain('song2')
      expect(result.trackIds).toContain('song3')

      // Check next/prev are correct based on random queue
      expect(result.nextSongId).toBe('song1')
      expect(result.prevSongId).toBe(null)
    })

    it('should handle duplicate songs', () => {
      const initialState = {
        ...defaultState,
        trackIds: ['old1', 'song1', 'old2'],
        currentPlaying: 'old1'
      }

      const result = queue(initialState, {
        type: types.ADD_TO_QUEUE_NEXT,
        songs: mockSongs.map((song) => createMockMedia(song.id, song.title)),
      })

      // Should not duplicate song1, but add song2 and song3
      expect(result.trackIds).toEqual(['old1', 'song1', 'song2', 'song3', 'old2'])
      expect(result.nextSongId).toBe('song1')
    })

    it('should maintain both queues in shuffle mode', () => {
      const initialState = {
        ...defaultState,
        trackIds: ['old1', 'old2', 'old3'],
        randomTrackIds: ['old2', 'old3', 'old1'],
        currentPlaying: 'old2',
        shuffle: true
      }

      const result = queue(initialState, {
        type: types.ADD_TO_QUEUE_NEXT,
        songs: mockSongs.map((song) => createMockMedia(song.id, song.title)),
      })

      // Check normal queue
      expect(result.trackIds).toContain('song1')
      expect(result.trackIds.length).toBe(6)

      // Check random queue
      expect(result.randomTrackIds).toContain('song1')
      expect(result.randomTrackIds.length).toBe(6)

      // Check song1 is after old2 in random queue
      const randomIndex = result.randomTrackIds.indexOf('old2')
      expect(result.randomTrackIds[randomIndex + 1]).toBe('song1')
    })
  })
})