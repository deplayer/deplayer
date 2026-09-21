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

import { useGenres, useMediaByGenre, useSongsByGenre } from './useGenres'

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

describe('useMediaByGenre', () => {
  beforeEach(() => {
    reset([])
  })

  const emittedQuery = () => {
    const calls = useQuery.mock.calls as unknown as Array<[{ label?: string; hash?: string }?]>
    const def = calls[0]?.[0]
    return { sql: def?.label ?? '', hash: def?.hash ?? '' }
  }

  it('matches the genre exactly through the media_genres join', () => {
    renderHook(() => useMediaByGenre('Rock'))
    const { sql } = emittedQuery()

    // Exact membership: join media_genres and compare genre with equality.
    // The previous `genresFlat LIKE '%Rock%'` also matched Rockabilly and
    // Classic Rock, diverging from the collection filter's exact semantics.
    expect(sql).toContain('INNER JOIN media_genres')
    expect(sql).toContain('mg.genre = ?')
    expect(sql).not.toContain('LIKE')
  })

  it('binds the genre and limit positionally', () => {
    renderHook(() => useMediaByGenre('Rock', 10))
    const { hash } = emittedQuery()
    expect(hash).toContain('0:Rock')
    expect(hash).toContain('1:10')
  })

  it('decodes raw rows into MediaRow objects (JSON columns parsed)', () => {
    reset([[
      {
        id: 'm1',
        title: 'Track',
        track: 1,
        artistId: 'a1',
        artistName: 'Artist',
        albumId: 'al1',
        albumName: 'Album',
        duration: 1000,
        discNumber: 1,
        playCount: 0,
        cover: '{"thumbnailUrl":"t","fullUrl":"f"}',
        stream: '{"subsonic":{"service":"subsonic","uris":[]}}',
        type: 'audio',
        genresFlat: 'Rock',
        providersFlat: 'subsonic',
      },
    ]])

    const { result } = renderHook(() => useMediaByGenre('Rock'))
    expect(result.current).toHaveLength(1)
    expect(result.current[0].id).toBe('m1')
    expect(result.current[0].cover).toEqual({ thumbnailUrl: 't', fullUrl: 'f' })
    expect(result.current[0].stream).toEqual({ subsonic: { service: 'subsonic', uris: [] } })
  })

  it('queries nothing and returns [] when there is no genre', () => {
    reset([null as unknown])
    const { result } = renderHook(() => useMediaByGenre(undefined))
    expect(result.current).toEqual([])
  })
})
