import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// Capture what each useQuery call resolves to.
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

import { useGenres, useSongsByGenre } from './useGenres'

const reset = (queries: unknown[]) => {
  useQueryReturns.length = 0
  for (const q of queries) useQueryReturns.push(q)
  callIndex = 0
  useQuery.mockClear()
}

describe('useGenres', () => {
  beforeEach(() => {
    reset([])
  })

  it('returns genre count rows, filtering empty names and NaN/negative counts', () => {
    reset([
      [
        { name: 'Rock', count: 5 },
        { name: 'Pop', count: 5 },
        { name: 'Jazz', count: 3 },
        { name: '', count: 10 },
        { name: 'Broken', count: Number.NaN },
      ],
    ])

    const { result } = renderHook(() => useGenres())
    // Empty names and NaN counts are filtered out.
    expect(result.current).toEqual([
      { name: 'Rock', count: 5 },
      { name: 'Pop', count: 5 },
      { name: 'Jazz', count: 3 },
    ])
    expect(useQuery).toHaveBeenCalledTimes(1)
  })

  it('filters malformed rows (empty name, NaN count, negative count)', () => {
    reset([
      [
        { name: 'Jazz', count: 5 },
        { name: '', count: 3 },
        { name: 'Blues', count: Number.NaN },
        { name: 'Pop', count: -1 },
      ],
    ])

    const { result } = renderHook(() => useGenres())
    expect(result.current).toEqual([{ name: 'Jazz', count: 5 }])
  })

  it('returns empty array when rows is not an array', () => {
    reset([null as unknown])

    const { result } = renderHook(() => useGenres())
    expect(result.current).toEqual([])
  })

  it('coerces string count values to numbers', () => {
    reset([
      [
        { name: 'Rock', count: '3' },
        { name: 'Pop', count: '10' },
      ],
    ])

    const { result } = renderHook(() => useGenres())
    // Hook passes through SQL-ordered rows; string counts are coerced to numbers.
    expect(result.current).toEqual([
      { name: 'Rock', count: 3 },
      { name: 'Pop', count: 10 },
    ])
  })
})

describe('useSongsByGenre', () => {
  beforeEach(() => {
    reset([])
  })

  it('returns genre -> track IDs map from media_genres rows', () => {
    reset([
      [
        { mediaId: 'm1', genre: 'Rock' },
        { mediaId: 'm2', genre: 'Rock' },
        { mediaId: 'm3', genre: 'Ambient' },
      ],
    ])

    const { result } = renderHook(() => useSongsByGenre())
    expect(result.current).toEqual({
      Rock: ['m1', 'm2'],
      Ambient: ['m3'],
    })
  })

  it('skips rows with empty mediaId or genre', () => {
    reset([
      [
        { mediaId: '', genre: 'Rock' },
        { mediaId: 'm1', genre: '' },
        { mediaId: 'm2', genre: 'Jazz' },
      ],
    ])

    const { result } = renderHook(() => useSongsByGenre())
    expect(result.current).toEqual({ Jazz: ['m2'] })
  })

  it('trims whitespace from genre names but does not normalize case', () => {
    reset([
      [
        { mediaId: 'm1', genre: ' Rock ' },
        { mediaId: 'm2', genre: 'Rock' },
        { mediaId: 'm3', genre: ' rock ' },
      ],
    ])

    const { result } = renderHook(() => useSongsByGenre())
    // Trimming happens but case is preserved (SQL also treats these as distinct).
    expect(result.current).toEqual({
      Rock: ['m1', 'm2'],
      'rock': ['m3'],
    })
  })

  it('returns empty object when rows is not an array', () => {
    reset([null as unknown])

    const { result } = renderHook(() => useSongsByGenre())
    expect(result.current).toEqual({})
  })
})
