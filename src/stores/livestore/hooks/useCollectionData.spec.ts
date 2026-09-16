import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// Capture what each useQuery call resolves to, in order.
const useQueryReturns: unknown[] = []
let callIndex = 0

const capturedQueries: unknown[] = []
const useQuery = vi.fn(() => {
  const value = useQueryReturns[callIndex] ?? []
  callIndex += 1
  return value
})

vi.mock('../store', () => ({
  useAppStore: () => ({ useQuery }),
}))

vi.mock('./useFavorites', () => ({
  useFavoriteIds: () => new Set<string>(),
}))

let mockFilters = { artists: [] as string[], types: [] as string[], genres: [] as string[], providers: [] as string[], favorites: false }
let mockSearchTerm = ''

vi.mock('../../uiStore', () => ({
  useUIStore: (sel: (s: unknown) => unknown) =>
    sel({
      activeFilters: mockFilters,
      searchTerm: mockSearchTerm,
    }),
}))

vi.mock('@livestore/livestore', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    queryDb: vi.fn((q: unknown) => {
      capturedQueries.push(q)
      return q
    }),
  }
})

import { useCollectionData } from './useCollectionData'

const setup = (queries: unknown[]) => {
  useQueryReturns.length = 0
  for (const q of queries) useQueryReturns.push(q)
  callIndex = 0
  useQuery.mockClear()
  capturedQueries.length = 0
}

describe('useCollectionData', () => {
  beforeEach(() => {
    mockFilters = { artists: [], types: [], genres: [], providers: [], favorites: false }
    mockSearchTerm = ''
  })

  it('fast path: extracts string ids from a single-column select result', () => {
    // LiveStore's `select('id')` returns a flat string array.
    setup([['a', 'b', 'c'], []])
    const { result } = renderHook(() => useCollectionData())
    expect(result.current.ids).toEqual(['a', 'b', 'c'])
    expect(result.current.map).toBeUndefined()
  })

  it('fast path: also handles row-object shape if the builder ever returns one', () => {
    setup([[{ id: 'x' }, { id: 'y' }], []])
    const { result } = renderHook(() => useCollectionData())
    expect(result.current.ids).toEqual(['x', 'y'])
  })

  it('fast path: filters out garbage rows instead of producing undefined ids', () => {
    setup([[null, undefined, 42, { foo: 'bar' }, 'ok'], []])
    const { result } = renderHook(() => useCollectionData())
    expect(result.current.ids).toEqual(['ok'])
  })

  it('fast path: empty library yields empty ids', () => {
    setup([[], []])
    const { result } = renderHook(() => useCollectionData())
    expect(result.current.ids).toEqual([])
  })

  it('genre-only filter uses indexed media_genres join and returns IDs without map', () => {
    mockFilters = { artists: [], types: [], genres: ['Rock'], providers: [], favorites: false }
    setup([
      [{ id: 'm1' }, { id: 'm2' }], // idsRaw from genreIdsQuery
      [],                             // rowsRaw (not used for genre-only)
    ])

    const { result } = renderHook(() => useCollectionData())
    expect(result.current).toEqual({ ids: ['m1', 'm2'], map: undefined })
    // Only 2 queries called: activeIdsQuery + rowsNoopQuery
    expect(useQuery).toHaveBeenCalledTimes(2)

    // Inspect the first query argument to verify it uses media_genres join.
    expect(capturedQueries.length).toBeGreaterThanOrEqual(1)
    const queryObj = capturedQueries[0] as Record<string, unknown>
    expect(typeof queryObj.query).toBe('string')
    const sql = String(queryObj.query)
    expect(sql).toContain('INNER JOIN media_genres mg ON mg.mediaId = m.id')
    expect(sql).toContain('mg.genre IN (?)')
    expect(sql).toContain('ORDER BY m.title ASC')
  })

  it('genre + provider filter falls back to slow row-data path', () => {
    mockFilters = { artists: [], types: [], genres: ['Rock'], providers: ['Spotify'], favorites: false }
    setup([
      [{ id: 'm1', title: 'Song', artistName: 'Artist', albumName: 'Album', albumId: 'a1', artistId: 'ar1', genresFlat: 'Rock', providersFlat: 'Spotify' }], // rowsRaw (active)
      [], // idsNoopQuery (inactive)
    ])

    const { result } = renderHook(() => useCollectionData())
    expect(result.current.map).toHaveProperty('m1')
    expect(result.current.ids).toEqual(['m1'])
  })
})
