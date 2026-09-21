import { describe, it, expect } from 'vitest'
import {
  parseIds,
  getActiveTrackIds,
  resolveCurrentSongId,
  encodePermutation,
  decodePermutation,
  permutationOf,
  permutationToTrackIds,
  activeOrderPermutation,
  activeIndexToOrderedIndex,
  orderedIndexToActiveIndex,
} from './resolution'
import type { QueueState } from './types'

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

  it('returns empty array for null or undefined queue', () => {
    expect(getActiveTrackIds(null)).toEqual([])
    expect(getActiveTrackIds(undefined)).toEqual([])
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

  it('prefers persisted currentTrackId over index-based fallback', () => {
    // Persisted currentTrackId is authoritative
    const q = makeQueue({ currentPlaying: 2, currentTrackId: 'persisted-id' })
    expect(resolveCurrentSongId(q)).toBe('persisted-id')
  })

  it('persisted currentTrackId wins even with conflicting index', () => {
    // Shuffle is on, index 0 maps to 'track-c' via randomTrackIds,
    // but the persisted currentTrackId='track-a' should win
    const q = makeQueue({
      currentPlaying: 0,
      shuffle: true,
      currentTrackId: 'track-a',
    })
    expect(resolveCurrentSongId(q)).toBe('track-a')
  })

  it('falls back to index when currentTrackId is null', () => {
    const q = makeQueue({ currentPlaying: 1, currentTrackId: null })
    expect(resolveCurrentSongId(q)).toBe('track-b')
  })

  it('falls back to index when currentTrackId is undefined', () => {
    const q = makeQueue({ currentPlaying: 2 })
    expect(resolveCurrentSongId(q)).toBe('track-c')
  })
})

describe('permutation blob', () => {
  it('encodes to Int32 little-endian bytes', () => {
    // Pins the stored wire format, independent of the encoder.
    expect(Array.from(encodePermutation([0, 1]))).toEqual([0, 0, 0, 0, 1, 0, 0, 0])
    expect(Array.from(encodePermutation([2, 0, 1]))).toEqual([
      2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
    ])
  })

  it('decodes Int32 little-endian bytes without the encoder', () => {
    // Hand-written bytes: the wire format must survive a decoder/encoder
    // change in lockstep.
    const blob = new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0])
    expect(Array.from(decodePermutation(blob)!)).toEqual([1, 0])
  })

  it('round-trips through a byte copy', () => {
    const indices = [3, 0, 2, 1]
    expect(Array.from(decodePermutation(encodePermutation(indices))!)).toEqual(indices)
  })

  it('returns null for absent, empty, or malformed input', () => {
    expect(decodePermutation(null)).toBeNull()
    expect(decodePermutation(undefined)).toBeNull()
    expect(decodePermutation(new Uint8Array(0))).toBeNull()
    expect(decodePermutation(new Uint8Array([1, 0, 0]))).toBeNull()
    expect(decodePermutation('nope')).toBeNull()
  })

  it('decodes a plain number array (JSON round-trip)', () => {
    expect(Array.from(decodePermutation([2, 1, 0])!)).toEqual([2, 1, 0])
  })
})

describe('permutationOf', () => {
  it('maps a shuffled track list to ordered indices', () => {
    expect(permutationOf(['a', 'b', 'c'], ['c', 'a', 'b'])).toEqual([2, 0, 1])
  })

  it('is always a complete permutation of the ordered indices', () => {
    // Ids the ordered list does not have are dropped, and unmentioned slots
    // are appended, so downstream length invariants hold.
    const perm = permutationOf(['a', 'b', 'c'], ['c', 'ghost'])
    expect(perm).toHaveLength(3)
    expect([...perm].sort()).toEqual([0, 1, 2])
  })

  it('keeps both slots of a duplicated track', () => {
    const perm = permutationOf(['a', 'b', 'a'], ['a', 'a', 'b'])
    expect(perm).toHaveLength(3)
    expect([...perm].sort()).toEqual([0, 1, 2])
  })

  it('returns the identity permutation for an empty random list', () => {
    expect(permutationOf(['a', 'b', 'c'], [])).toEqual([0, 1, 2])
  })
})

describe('activeOrderPermutation', () => {
  it('is null when shuffle is off, whatever is stored', () => {
    expect(activeOrderPermutation(false, encodePermutation([1, 0]))).toBeNull()
    expect(activeOrderPermutation(undefined, null)).toBeNull()
  })

  it('decodes the stored order when shuffle is on', () => {
    expect(Array.from(activeOrderPermutation(true, encodePermutation([1, 0]))!)).toEqual([1, 0])
  })

  it('is null when shuffle is on with nothing stored', () => {
    expect(activeOrderPermutation(true, null)).toBeNull()
  })
})

describe('position mapping', () => {
  it('maps an active position to an ordered index through the permutation', () => {
    const perm = Int32Array.from([2, 0, 1])
    expect(activeIndexToOrderedIndex(perm, 0)).toBe(2)
    expect(activeIndexToOrderedIndex(perm, 2)).toBe(1)
  })

  it('treats a missing or out-of-range position as identity', () => {
    const perm = Int32Array.from([2, 0, 1])
    expect(activeIndexToOrderedIndex(null, 5)).toBe(5)
    expect(activeIndexToOrderedIndex(perm, 5)).toBe(5)
    expect(activeIndexToOrderedIndex(perm, -1)).toBe(-1)
  })

  it('maps an ordered index back to its active position', () => {
    const perm = Int32Array.from([2, 0, 1])
    expect(orderedIndexToActiveIndex(perm, 2)).toBe(0)
    expect(orderedIndexToActiveIndex(perm, 0)).toBe(1)
    expect(orderedIndexToActiveIndex(perm, 1)).toBe(2)
    expect(orderedIndexToActiveIndex(null, 4)).toBe(4)
  })

  it('rebuilds the shuffled track ids from the ordered list', () => {
    expect(permutationToTrackIds(['a', 'b', 'c'], Int32Array.from([2, 0, 1]))).toEqual([
      'c', 'a', 'b',
    ])
    expect(permutationToTrackIds(['a', 'b'], null)).toEqual([])
  })
})

