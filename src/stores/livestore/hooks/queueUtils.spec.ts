import { describe, it, expect } from 'vitest'
import {
  parseIds,
  getActiveTrackIds,
  resolveCurrentSongId,
  resolveQueueNavigation,
  QueueState,
} from './queueUtils'

const TRACKS = ['track-a', 'track-b', 'track-c', 'track-d']
const SHUFFLED = ['track-c', 'track-a', 'track-d', 'track-b']

function makeQueue(overrides: Partial<QueueState> = {}): QueueState {
  return {
    trackIds: TRACKS,
    randomTrackIds: SHUFFLED,
    currentPlaying: 0,
    shuffle: false,
    repeat: false,
    ...overrides,
  }
}

describe('parseIds', () => {
  it('returns array as-is', () => {
    expect(parseIds(['a', 'b'])).toEqual(['a', 'b'])
  })

  it('parses JSON string', () => {
    expect(parseIds('["a","b"]')).toEqual(['a', 'b'])
  })

  it('returns empty array for null/undefined', () => {
    expect(parseIds(null)).toEqual([])
    expect(parseIds(undefined)).toEqual([])
  })

  it('returns empty array for invalid JSON', () => {
    expect(parseIds('not-json')).toEqual([])
  })
})

describe('getActiveTrackIds', () => {
  it('returns trackIds when shuffle is off', () => {
    expect(getActiveTrackIds(makeQueue())).toEqual(TRACKS)
  })

  it('returns randomTrackIds when shuffle is on', () => {
    expect(getActiveTrackIds(makeQueue({ shuffle: true }))).toEqual(SHUFFLED)
  })

  it('handles JSON string trackIds', () => {
    const q = makeQueue({ trackIds: JSON.stringify(TRACKS), shuffle: false })
    expect(getActiveTrackIds(q)).toEqual(TRACKS)
  })

  it('handles JSON string randomTrackIds', () => {
    const q = makeQueue({ randomTrackIds: JSON.stringify(SHUFFLED), shuffle: true })
    expect(getActiveTrackIds(q)).toEqual(SHUFFLED)
  })
})

describe('resolveCurrentSongId', () => {
  it('returns null for null queue', () => {
    expect(resolveCurrentSongId(null)).toBeNull()
  })

  it('returns null when currentPlaying is null', () => {
    expect(resolveCurrentSongId(makeQueue({ currentPlaying: null }))).toBeNull()
  })

  it('returns null when currentPlaying is undefined', () => {
    expect(resolveCurrentSongId(makeQueue({ currentPlaying: undefined }))).toBeNull()
  })

  it('returns correct track when shuffle is off', () => {
    expect(resolveCurrentSongId(makeQueue({ currentPlaying: 2 }))).toBe('track-c')
  })

  it('returns correct track when shuffle is on (the regression)', () => {
    // This is the exact bug: index 2 with shuffle ON must resolve
    // to randomTrackIds[2], NOT trackIds[2]
    const q = makeQueue({ currentPlaying: 2, shuffle: true })
    expect(resolveCurrentSongId(q)).toBe('track-d') // SHUFFLED[2]
    // Before the fix, this would have returned 'track-c' (TRACKS[2])
  })

  it('returns null for out-of-bounds index', () => {
    expect(resolveCurrentSongId(makeQueue({ currentPlaying: 99 }))).toBeNull()
  })

  it('returns first track at index 0', () => {
    expect(resolveCurrentSongId(makeQueue({ currentPlaying: 0 }))).toBe('track-a')
    expect(resolveCurrentSongId(makeQueue({ currentPlaying: 0, shuffle: true }))).toBe('track-c')
  })
})

describe('resolveQueueNavigation', () => {
  it('returns nulls for null queue', () => {
    expect(resolveQueueNavigation(null)).toEqual({ nextSongId: null, prevSongId: null })
  })

  it('returns next and prev in normal order', () => {
    const result = resolveQueueNavigation(makeQueue({ currentPlaying: 1 }))
    expect(result.nextSongId).toBe('track-c')
    expect(result.prevSongId).toBe('track-a')
  })

  it('uses randomTrackIds for navigation when shuffle is on', () => {
    const result = resolveQueueNavigation(makeQueue({ currentPlaying: 1, shuffle: true }))
    // SHUFFLED = ['track-c', 'track-a', 'track-d', 'track-b']
    expect(result.nextSongId).toBe('track-d') // SHUFFLED[2]
    expect(result.prevSongId).toBe('track-c') // SHUFFLED[0]
  })

  it('returns null next at end of queue without repeat', () => {
    const result = resolveQueueNavigation(makeQueue({ currentPlaying: 3 }))
    expect(result.nextSongId).toBeNull()
    expect(result.prevSongId).toBe('track-c')
  })

  it('wraps around with repeat on', () => {
    const result = resolveQueueNavigation(makeQueue({ currentPlaying: 3, repeat: true }))
    expect(result.nextSongId).toBe('track-a') // wraps to 0
  })

  it('returns null prev at start without repeat', () => {
    const result = resolveQueueNavigation(makeQueue({ currentPlaying: 0 }))
    expect(result.prevSongId).toBeNull()
    expect(result.nextSongId).toBe('track-b')
  })

  it('wraps prev with repeat on', () => {
    const result = resolveQueueNavigation(makeQueue({ currentPlaying: 0, repeat: true }))
    expect(result.prevSongId).toBe('track-d') // wraps to last
  })
})
