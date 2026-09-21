import { describe, it, expect } from 'vitest'
import { stepNext, stepPrevious, stepToMedia } from './stepping'
import type { ActiveRow, QueueHeadRow } from './types'

const head = (overrides: Partial<QueueHeadRow> = {}): QueueHeadRow => ({
  id: 'default',
  currentPlaying: 0,
  currentTrackId: null,
  shuffle: false,
  repeat: false,
  randomOrder: null,
  updatedAt: 0,
  ...overrides,
})

/** A row at an active-list position (already permutation-resolved). */
const row = (position: number, trackId: string): ActiveRow => ({
  position,
  trackId,
})

describe('stepNext', () => {
  it('advances to the next row when one exists', () => {
    expect(stepNext(head({ currentPlaying: 0 }), row(1, 'b'), row(0, 'a'))).toEqual({
      queueId: 'default',
      position: 1,
      trackId: 'b',
    })
  })

  it('returns null at the end when repeat is off', () => {
    expect(stepNext(head({ currentPlaying: 2 }), null, row(0, 'a'))).toBeNull()
  })

  it('wraps to position 0 with the first trackId when repeat is on', () => {
    expect(stepNext(head({ currentPlaying: 2, repeat: true }), null, row(0, 'a'))).toEqual({
      queueId: 'default',
      position: 0,
      trackId: 'a',
    })
  })

  it('returns null for an empty list even when repeat is on', () => {
    expect(stepNext(head({ currentPlaying: 0, repeat: true }), null, null)).toBeNull()
  })
})

describe('stepPrevious', () => {
  it('goes back to the previous row when one exists', () => {
    expect(stepPrevious(head({ currentPlaying: 1 }), row(0, 'a'), row(2, 'c'))).toEqual({
      queueId: 'default',
      position: 0,
      trackId: 'a',
    })
  })

  it('stays at position 0 with an undefined trackId when repeat is off', () => {
    expect(stepPrevious(head({ currentPlaying: 0 }), null, row(2, 'c'))).toEqual({
      queueId: 'default',
      position: 0,
      trackId: undefined,
    })
  })

  it('wraps to the last row when repeat is on', () => {
    expect(stepPrevious(head({ currentPlaying: 0, repeat: true }), null, row(2, 'c'))).toEqual({
      queueId: 'default',
      position: 2,
      trackId: 'c',
    })
  })

  it('returns position 0 with an undefined trackId for an empty list', () => {
    expect(stepPrevious(head({ currentPlaying: 0, repeat: true }), null, null)).toEqual({
      queueId: 'default',
      position: 0,
      trackId: undefined,
    })
  })
})

describe('stepToMedia', () => {
  it('jumps to the found row', () => {
    expect(stepToMedia(row(2, 'c'))).toEqual({
      queueId: 'default',
      position: 2,
      trackId: 'c',
    })
  })

  it('returns null when the media is not in the active list', () => {
    expect(stepToMedia(null)).toBeNull()
  })
})
