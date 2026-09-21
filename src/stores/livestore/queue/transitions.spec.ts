/**
 * Tests for the pure queue transition functions.
 *
 * Every function is tested as a behavior contract: given a QueueState, what
 * event (if any) must be committed? Two behaviors are deliberately locked in
 * as suspected bugs (see the "suspected bug" tests); changing them requires a
 * conscious decision and updated expectations here.
 */
import { describe, it, expect } from 'vitest'
import type { QueueState } from './types'
import {
  fisherYates,
  deriveCurrentTrackId,
} from './resolution'
import {
  playAll,
  addToQueue,
  addNext,
  removeFromQueue,
  clearQueue,
  toggleShuffle,
  toggleRepeat,
  setCurrentPlaying,
} from './transitions'

const makeState = (overrides: Partial<QueueState> = {}): QueueState => ({
  trackIds: ['a', 'b', 'c'],
  randomTrackIds: [],
  currentPlaying: 0,
  currentTrackId: null,
  shuffle: false,
  repeat: false,
  ...overrides,
})

/** Deterministic RNG: returns values in order until exhausted. */
const rng = (values: number[]) => {
  let i = 0
  return () => values[i++] ?? 0
}

describe('deriveCurrentTrackId', () => {
  it('prefers the plain list at currentPlaying when shuffle is off', () => {
    expect(deriveCurrentTrackId(['a', 'b', 'c'], undefined, 2, false)).toBe('c')
  })

  it('uses the shuffled list at currentPlaying when shuffle is on', () => {
    expect(deriveCurrentTrackId(['a', 'b', 'c'], ['c', 'a', 'b'], 1, true)).toBe('a')
  })

  it('falls back to the plain list when shuffle is on but randomTrackIds is undefined (materializer edge case)', () => {
    expect(deriveCurrentTrackId(['a', 'b', 'c'], undefined, 1, true)).toBe('b')
  })

  it('returns null when currentPlaying is null or negative', () => {
    expect(deriveCurrentTrackId(['a', 'b', 'c'], undefined, null, false)).toBeNull()
    expect(deriveCurrentTrackId(['a', 'b', 'c'], undefined, -1, false)).toBeNull()
  })

  it('returns null when the index is out of range for the active list', () => {
    expect(deriveCurrentTrackId(['a', 'b', 'c'], undefined, 3, false)).toBeNull()
    expect(deriveCurrentTrackId(['a', 'b', 'c'], ['c'], 1, true)).toBeNull()
  })

  it('returns null for an empty active list', () => {
    expect(deriveCurrentTrackId([], undefined, 0, false)).toBeNull()
  })
})

describe('fisherYates', () => {
  it('is a no-op for zero and one elements', () => {
    expect(fisherYates([], rng([0.5]))).toEqual([])
    expect(fisherYates(['a'], rng([0.99]))).toEqual(['a'])
  })

  it('permutes deterministically from the injected random values', () => {
    // [a,b,c] with r=[0.9,0.9]: i=2 j=floor(0.9*3)=2 no swap; i=1 j=floor(0.9*2)=1 no swap -> identity
    expect(fisherYates(['a', 'b', 'c'], rng([0.9, 0.9]))).toEqual(['a', 'b', 'c'])
    // r=[0.5,0.25]: i=2 j=floor(0.5*3)=1 swap idx2/1 -> [a,c,b]; i=1 j=floor(0.25*2)=0 swap idx1/0 -> [c,a,b]
    expect(fisherYates(['a', 'b', 'c'], rng([0.5, 0.25]))).toEqual(['c', 'a', 'b'])
    // r=[0.33,0.9]: i=2 j=floor(0.33*3)=0 swap idx2/0 -> [c,b,a]; i=1 j=floor(0.9*2)=1 no swap
    expect(fisherYates(['a', 'b', 'c'], rng([0.33, 0.9]))).toEqual(['c', 'b', 'a'])
  })

  it('does not mutate the input array', () => {
    const input = ['a', 'b', 'c']
    fisherYates(input, rng([0.5, 0.25]))
    expect(input).toEqual(['a', 'b', 'c'])
  })
})

describe('playAll', () => {
  it('returns null for an empty track list', () => {
    expect(playAll([])).toBeNull()
  })

  it('resets the queue to the given tracks at position 0 with shuffle/repeat off', () => {
    expect(playAll(['x', 'y'])).toEqual({
      id: 'default',
      trackIds: ['x', 'y'],
      currentPlaying: 0,
      shuffle: false,
      repeat: false,
    })
  })

  it('does not mutate the input array', () => {
    const input = ['x', 'y']
    playAll(input)
    expect(input).toEqual(['x', 'y'])
  })
})

describe('addToQueue', () => {
  it('returns null for an empty track list', () => {
    expect(addToQueue(makeState(), [])).toBeNull()
  })

  it('creates a fresh queue with no randomTrackIds key when there is no current queue', () => {
    const event = addToQueue(null, ['a', 'b'])
    expect(event).not.toBeNull()
    if (event === null) return
    expect(event.id).toBe('default')
    expect(event.trackIds).toEqual(['a', 'b'])
    expect(event.currentPlaying).toBeUndefined()
    expect(Object.keys(event)).not.toContain('randomTrackIds')
  })

  it('appends to the end of an existing queue, preserving position and flags (suspected bug #1: randomTrackIds omitted)', () => {
    const event = addToQueue(makeState({ currentPlaying: 1, shuffle: true, repeat: true }), ['d'])
    expect(event).toEqual({
      id: 'default',
      trackIds: ['a', 'b', 'c', 'd'],
      currentPlaying: 1,
      shuffle: true,
      repeat: true,
    })
    // The materializer's onConflict resets randomTrackIds to [] when the key
    // is absent — the shuffle order is wiped while shuffle stays true.
    expect(Object.keys(event!)).not.toContain('randomTrackIds')
  })

  it('appends with a null currentPlaying as undefined', () => {
    const event = addToQueue(makeState({ currentPlaying: null }), ['d'])
    expect(event?.trackIds).toEqual(['a', 'b', 'c', 'd'])
    expect(event?.currentPlaying).toBeUndefined()
  })
})

describe('addNext', () => {
  it('returns null for an empty track list', () => {
    expect(addNext(makeState(), [])).toBeNull()
  })

  it('starts a fresh queue at the first added track and returns it', () => {
    const result = addNext(null, ['x', 'y'])
    expect(result?.firstTrackId).toBe('x')
    expect(result?.event).toEqual({
      id: 'default',
      trackIds: ['x', 'y'],
      currentPlaying: 0,
      shuffle: false,
      repeat: false,
    })
  })

  it('inserts after the currently playing track in an unshuffled queue', () => {
    const result = addNext(makeState({ currentPlaying: 1 }), ['d'])
    expect(result?.event).toEqual({
      id: 'default',
      trackIds: ['a', 'b', 'd', 'c'],
      currentPlaying: 1,
      shuffle: false,
      repeat: false,
    })
    expect(result?.firstTrackId).toBeNull()
  })

  it('inserts using the plain-list index in a shuffled queue (randomTrackIds omitted)', () => {
    const result = addNext(
      makeState({ shuffle: true, randomTrackIds: ['c', 'a', 'b'], currentPlaying: 1 }),
      ['d']
    )
    // cp=1 → insertPosition=2 in the plain list; the shuffled order is not touched.
    expect(result?.event?.trackIds).toEqual(['a', 'b', 'd', 'c'])
    expect(Object.keys(result?.event ?? {})).not.toContain('randomTrackIds')
    expect(result?.event?.shuffle).toBe(true)
  })

  it('inserts at the front when there is no current position', () => {
    const result = addNext(makeState({ currentPlaying: null }), ['d'])
    // cp=null → insertPosition=0, i.e. before the first track.
    expect(result?.event?.trackIds).toEqual(['d', 'a', 'b', 'c'])
    expect(result?.event?.currentPlaying).toBeUndefined()
  })
})

describe('removeFromQueue', () => {
  it('returns null when there is no queue', () => {
    expect(removeFromQueue(null, 'a')).toBeNull()
  })

  it('removes all occurrences of the track', () => {
    const event = removeFromQueue(makeState({ trackIds: ['a', 'b', 'a', 'c'], currentPlaying: 0 }), 'a')
    expect(event?.trackIds).toEqual(['b', 'c'])
  })

  it('clamps currentPlaying when the removal leaves it out of range', () => {
    const event = removeFromQueue(makeState({ trackIds: ['a', 'b', 'c'], currentPlaying: 2 }), 'c')
    expect(event?.trackIds).toEqual(['a', 'b'])
    expect(event?.currentPlaying).toBe(1)
  })

  it('sets currentPlaying to undefined when the queue becomes empty', () => {
    const event = removeFromQueue(makeState({ trackIds: ['a'], currentPlaying: 0 }), 'a')
    expect(event?.trackIds).toEqual([])
    // null is normalized to undefined in the event payload (?? undefined).
    expect(event?.currentPlaying).toBeUndefined()
  })

  it('clamps currentPlaying when the removal shifts the position down', () => {
    const event = removeFromQueue(makeState({ trackIds: ['a', 'b', 'c'], currentPlaying: 2 }), 'a')
    expect(event?.trackIds).toEqual(['b', 'c'])
    // cp=2 >= new length 2 → clamped to 1 (the same song, now at index 1).
    expect(event?.currentPlaying).toBe(1)
  })

  it('commits an unchanged event when the track is not in the queue', () => {
    const event = removeFromQueue(makeState({ currentPlaying: 1 }), 'z')
    expect(event).toEqual({
      id: 'default',
      trackIds: ['a', 'b', 'c'],
      currentPlaying: 1,
      shuffle: false,
      repeat: false,
    })
    expect(Object.keys(event!)).not.toContain('randomTrackIds')
  })
})

describe('clearQueue', () => {
  it('always emits a queueCleared event for the default queue id', () => {
    expect(clearQueue()).toEqual({ queueId: 'default' })
  })
})

describe('toggleShuffle', () => {
  it('returns null when there is no queue or the queue is empty', () => {
    expect(toggleShuffle(null, false)).toBeNull()
    expect(toggleShuffle(makeState({ trackIds: [], randomTrackIds: [] }), false)).toBeNull()
  })

  it('enables shuffle with a deterministic permutation of ordered indices and remaps currentPlaying to the same song', () => {
    const event = toggleShuffle(makeState({ currentPlaying: 1 }), true, rng([0.5, 0.25]))
    // fisherYates([0,1,2]) = [2,0,1] -> shuffled ids ['c','a','b'] ('b' moves 1 -> 2)
    expect(event).toEqual({
      queueId: 'default',
      shuffle: true,
      currentPlaying: 2,
      randomOrder: [2, 0, 1],
    })
  })

  it('enabling shuffle on an already-shuffled queue anchors on trackIds (suspected bug #2, locked in)', () => {
    // Active song is randomTrackIds[1] = 'a'. Re-enabling shuffles the plain
    // list and anchors on trackIds[1] ('b'), so the playing song changes from
    // 'a' to 'b'. The permutation is a fresh one over the plain list, not
    // derived from the previous order.
    const state = makeState({ shuffle: true, randomTrackIds: ['c', 'a', 'b'], currentPlaying: 1 })
    const event = toggleShuffle(state, true, rng([0.9, 0.9])) // identity permutation
    expect(event).toEqual({
      queueId: 'default',
      shuffle: true,
      currentPlaying: 1,
      randomOrder: [0, 1, 2],
    })
  })

  it('disables shuffle by remapping the shuffled position back to the plain-list index and clearing the permutation', () => {
    const event = toggleShuffle(
      makeState({ shuffle: true, randomTrackIds: ['b', 'c', 'a'], currentPlaying: 2 }),
      false
    )
    expect(event).toEqual({
      queueId: 'default',
      shuffle: false,
      currentPlaying: 0, // 'a' is at index 0 in the plain list
      randomOrder: [],
    })
  })

  it('disables shuffle with null currentPlaying and no remapping', () => {
    const event = toggleShuffle(
      makeState({ shuffle: true, randomTrackIds: ['b', 'c', 'a'], currentPlaying: null }),
      false
    )
    expect(event?.randomOrder).toEqual([])
    expect(event?.currentPlaying).toBeUndefined()
    expect(event?.shuffle).toBe(false)
  })

  it('disables shuffle with an out-of-range currentPlaying', () => {
    const event = toggleShuffle(
      makeState({ shuffle: true, randomTrackIds: ['b', 'c'], trackIds: ['a', 'b', 'c'], currentPlaying: 5 }),
      false
    )
    expect(event?.randomOrder).toEqual([])
    expect(event?.currentPlaying).toBe(5)
    expect(event?.shuffle).toBe(false)
  })

  it('emits a head-only event that cannot clobber repeat', () => {
    const on = toggleShuffle(makeState({ repeat: true }), true, rng([0.5, 0.25]))
    expect(on).not.toHaveProperty('repeat')
    const off = toggleShuffle(
      makeState({ shuffle: true, randomTrackIds: ['b', 'c', 'a'], currentPlaying: 1, repeat: true }),
      false
    )
    expect(off).not.toHaveProperty('repeat')
    expect(off).not.toHaveProperty('trackIds')
  })
})

describe('toggleRepeat', () => {
  it('returns null when there is no queue', () => {
    expect(toggleRepeat(null, false)).toBeNull()
  })

  it('emits a partial repeat-toggled event with the new flag', () => {
    expect(toggleRepeat(makeState({ currentPlaying: 1 }), true)).toEqual({
      queueId: 'default',
      repeat: true,
    })
    expect(toggleRepeat(makeState(), false)).toEqual({ queueId: 'default', repeat: false })
  })
})

describe('setCurrentPlaying', () => {
  it('emits a partial positionChanged event with the given position and no trackId', () => {
    expect(setCurrentPlaying(3)).toEqual({ queueId: 'default', position: 3 })
  })
})

