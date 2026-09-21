import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// Capture what each useQuery call resolves to, in call order.
const useQueryReturns: unknown[] = []
let callIndex = 0
const useQuery = vi.fn(() => {
  const value = useQueryReturns[callIndex] ?? []
  callIndex += 1
  return value
})

vi.mock('../store', () => ({
  useAppStore: () => ({ useQuery }),
}))

import { usePlaylistById, usePlaylists } from './usePlaylists'

const reset = (queries: unknown[]) => {
  useQueryReturns.length = 0
  for (const q of queries) useQueryReturns.push(q)
  callIndex = 0
  useQuery.mockClear()
}

describe('usePlaylists', () => {
  beforeEach(() => {
    reset([])
  })

  it('assembles each playlist trackIds from its item rows in position order', () => {
    reset([
      [
        { id: 'p1', name: 'A' },
        { id: 'p2', name: 'B' },
      ],
      [
        // Deliberately out of order — assembly must sort by position.
        { playlistId: 'p1', position: 1, trackId: 't2' },
        { playlistId: 'p1', position: 0, trackId: 't1' },
        { playlistId: 'p2', position: 0, trackId: 't9' },
      ],
    ])

    const { result } = renderHook(() => usePlaylists())
    expect(result.current).toEqual([
      { id: 'p1', name: 'A', trackIds: ['t1', 't2'] },
      { id: 'p2', name: 'B', trackIds: ['t9'] },
    ])
  })

  it('gives a playlist with no item rows an empty trackIds', () => {
    reset([[{ id: 'p1', name: 'A' }], []])

    const { result } = renderHook(() => usePlaylists())
    expect(result.current).toEqual([{ id: 'p1', name: 'A', trackIds: [] }])
  })

  it('returns [] when the playlist query is not an array', () => {
    reset([null as unknown, []])

    const { result } = renderHook(() => usePlaylists())
    expect(result.current).toEqual([])
  })
})

describe('usePlaylistById', () => {
  beforeEach(() => {
    reset([])
  })

  it('assembles the trackIds of the requested playlist', () => {
    reset([
      [{ id: 'p1', name: 'A' }],
      [
        { playlistId: 'p1', position: 1, trackId: 't2' },
        { playlistId: 'p1', position: 0, trackId: 't1' },
      ],
    ])

    const { result } = renderHook(() => usePlaylistById('p1'))
    expect(result.current).toEqual({ id: 'p1', name: 'A', trackIds: ['t1', 't2'] })
  })

  it('returns null when the playlist does not exist', () => {
    reset([[], []])

    const { result } = renderHook(() => usePlaylistById('missing'))
    expect(result.current).toBeNull()
  })
})
