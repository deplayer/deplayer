/**
 * Tests for the synchronous queue store readers: `readQueue` (canonical
 * normalized read) and `resolveCurrentPlayingSongId` (non-reactive direct
 * queue-table lookup). A fake store records queries so assertions are on
 * observable behavior only.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Mock } from 'vitest'
import type { LiveStore } from '../accessor'
import { readQueue, resolveCurrentPlayingSongId } from './storeReaders'

interface FakeStore {
  query: Mock
  commit: Mock
}

const makeStore = (rows: unknown[] = []): FakeStore => ({
  query: vi.fn(async () => rows),
  commit: vi.fn(async () => undefined),
})

/** Raw queue row as stored in the DB. */
const makeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'default',
  trackIds: JSON.stringify(['a', 'b', 'c']),
  randomTrackIds: null,
  currentPlaying: 0,
  currentTrackId: null,
  shuffle: false,
  repeat: false,
  updatedAt: new Date(),
  ...overrides,
})

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('readQueue', () => {
  it('returns null when no queue row exists', async () => {
    expect(await readQueue(makeStore([]) as unknown as LiveStore)).toBeNull()
  })

  it('normalizes a stored row into QueueState', async () => {
    const store = makeStore([
      makeRow({
        trackIds: JSON.stringify(['a', 'b']),
        randomTrackIds: JSON.stringify(['b', 'a']),
        currentPlaying: 1,
        shuffle: 1,
        repeat: 0,
      }),
    ])
    expect(await readQueue(store as unknown as LiveStore)).toEqual({
      trackIds: ['a', 'b'],
      randomTrackIds: ['b', 'a'],
      currentPlaying: 1,
      currentTrackId: null,
      shuffle: true,
      repeat: false,
    })
  })

  it('treats an empty-string currentTrackId as null and accepts array-typed rows', async () => {
    const store = makeStore([
      makeRow({ trackIds: ['x'], randomTrackIds: [], currentTrackId: '', shuffle: true, repeat: true }),
    ])
    expect(await readQueue(store as unknown as LiveStore)).toEqual({
      trackIds: ['x'],
      randomTrackIds: [],
      currentPlaying: 0,
      currentTrackId: null,
      shuffle: true,
      repeat: true,
    })
  })

  it('returns null and logs when the query fails', async () => {
    const store = makeStore()
    store.query.mockRejectedValue(new Error('db closed'))
    expect(await readQueue(store as unknown as LiveStore)).toBeNull()
    expect(console.error).toHaveBeenCalled()
  })
})

describe('resolveCurrentPlayingSongId', () => {
  function makeLiveStoreMock(queryResult: Array<Record<string, unknown>>) {
    return {
      query: vi.fn().mockReturnValue(queryResult),
    }
  }

  it('returns null when liveStore getter returns null', () => {
    const result = resolveCurrentPlayingSongId(() => null)
    expect(result).toBeNull()
  })

  it('returns null when queue table is empty', () => {
    const mockStore = makeLiveStoreMock([])
    const result = resolveCurrentPlayingSongId(() => mockStore as unknown as LiveStore)
    expect(result).toBeNull()
  })

  it('resolves song ID using currentTrackId (authoritative)', () => {
    const mockStore = makeLiveStoreMock([{
      trackIds: JSON.stringify(['song-1', 'song-2', 'song-3']),
      randomTrackIds: JSON.stringify(['song-3', 'song-1', 'song-2']),
      currentPlaying: 0,
      currentTrackId: 'song-authorized',
      shuffle: false,
    }])
    const result = resolveCurrentPlayingSongId(() => mockStore as unknown as LiveStore)
    expect(result).toBe('song-authorized')
  })

  it('falls back to index-based resolution when currentTrackId is null', () => {
    const mockStore = makeLiveStoreMock([{
      trackIds: JSON.stringify(['song-1', 'song-2', 'song-3']),
      randomTrackIds: null,
      currentPlaying: 2,
      currentTrackId: null,
      shuffle: false,
    }])
    const result = resolveCurrentPlayingSongId(() => mockStore as unknown as LiveStore)
    expect(result).toBe('song-3')
  })

  it('falls back to index-based resolution when currentTrackId is undefined', () => {
    const mockStore = makeLiveStoreMock([{
      trackIds: JSON.stringify(['song-1', 'song-2', 'song-3']),
      currentPlaying: 1,
      shuffle: false,
      // currentTrackId not in row → undefined
    }])
    const result = resolveCurrentPlayingSongId(() => mockStore as unknown as LiveStore)
    expect(result).toBe('song-2')
  })

  it('uses shuffle order (randomTrackIds) when shuffle is on', () => {
    const mockStore = makeLiveStoreMock([{
      trackIds: JSON.stringify(['song-1', 'song-2', 'song-3']),
      randomTrackIds: JSON.stringify(['song-3', 'song-1', 'song-2']),
      currentPlaying: 1,
      currentTrackId: null,
      shuffle: true,
    }])
    const result = resolveCurrentPlayingSongId(() => mockStore as unknown as LiveStore)
    // Shuffle is on, so index 1 resolves into randomTrackIds
    expect(result).toBe('song-1')
  })

  it('returns null when currentPlaying is null', () => {
    const mockStore = makeLiveStoreMock([{
      trackIds: JSON.stringify(['song-1', 'song-2']),
      currentPlaying: null,
      currentTrackId: null,
      shuffle: false,
    }])
    const result = resolveCurrentPlayingSongId(() => mockStore as unknown as LiveStore)
    expect(result).toBeNull()
  })
})
