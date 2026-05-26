import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

const useQuery = vi.fn<[query: unknown], unknown[]>(() => [])
vi.mock('../store', () => ({ useAppStore: () => ({ useQuery }) }))
vi.mock('./useFavorites', () => ({ useFavoriteIds: () => new Set<string>() }))

import { useSearchMedia } from './useMedia'

describe('useSearchMedia empty input does not subscribe to media table', () => {
  it('useSearchMedia("") subscribes only to the shared NOOP query, not media', () => {
    useQuery.mockClear()
    const { result } = renderHook(() => useSearchMedia(''))
    expect(result.current).toEqual([])

    // Both title and artist sub-queries should target the idle NOOP query.
    // NOOP_QUERY is a module-singleton, so both useQuery calls must receive
    // the same query reference. If either branch fell back to a
    // `tables.media` query the references would diverge.
    expect(useQuery).toHaveBeenCalledTimes(2)
    const firstQuery = useQuery.mock.calls[0][0]
    for (const [query] of useQuery.mock.calls) {
      expect(query).toBe(firstQuery)
    }
  })
})
