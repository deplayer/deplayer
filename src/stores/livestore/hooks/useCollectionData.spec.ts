import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

// Capture what each useQuery call resolves to, in order.
// Order in useCollectionData is: idsRaw first, then rowsRaw.
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

vi.mock('./useFavorites', () => ({
  useFavoriteIds: () => new Set<string>(),
}))

vi.mock('../../uiStore', () => ({
  useUIStore: (sel: (s: unknown) => unknown) =>
    sel({
      activeFilters: { artists: [], types: [], genres: [], providers: [], favorites: false },
      searchTerm: '',
    }),
}))

import { useCollectionData } from './useCollectionData'

const setup = (queries: unknown[]) => {
  useQueryReturns.length = 0
  for (const q of queries) useQueryReturns.push(q)
  callIndex = 0
  useQuery.mockClear()
}

describe('useCollectionData', () => {
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
})
