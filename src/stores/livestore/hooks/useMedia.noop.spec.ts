import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const useQuery = vi.fn<[query: unknown], unknown[]>(() => [])
vi.mock('../store', () => ({ useAppStore: () => ({ useQuery }) }))
vi.mock('./useFavorites', () => ({ useFavoriteIds: () => new Set<string>() }))

import { useSearchMedia, useSearchMediaIds, useMediaMapForIds } from './useMedia'

/**
 * Serialized form of the queryable passed to the Nth useQuery call.
 * Stringifying (instead of reading a specific field) keeps the assertions
 * independent of the queryDb wrapper shape.
 */
const queryText = (n: number): string => JSON.stringify(useQuery.mock.calls[n][0]) ?? ''

describe('idle media hooks never subscribe to sync_state', () => {
  beforeEach(() => { useQuery.mockClear() })

  it('useSearchMedia("") targets media with an impossible-id filter', () => {
    const { result } = renderHook(() => useSearchMedia(''))
    expect(result.current).toEqual([])
    expect(useQuery).toHaveBeenCalledTimes(2)
    for (let i = 0; i < 2; i++) {
      const q = queryText(i)
      expect(q).toContain('media')
      expect(q).not.toContain('sync_state')
    }
  })

  it('useSearchMedia("queen") issues LIKE queries against media', () => {
    renderHook(() => useSearchMedia('queen'))
    expect(useQuery).toHaveBeenCalledTimes(2)
    for (let i = 0; i < 2; i++) {
      const q = queryText(i)
      expect(q).toContain('LIKE')
      expect(q).not.toContain('sync_state')
    }
  })

  it('useSearchMediaIds("") targets media ids only', () => {
    const { result } = renderHook(() => useSearchMediaIds(''))
    expect(result.current).toEqual([])
    expect(useQuery).toHaveBeenCalledTimes(2)
    for (let i = 0; i < 2; i++) {
      expect(queryText(i)).not.toContain('sync_state')
    }
  })

  it('useMediaMapForIds([]) does not subscribe to sync_state', () => {
    const { result } = renderHook(() => useMediaMapForIds([]))
    expect(result.current).toEqual({})
    expect(useQuery).toHaveBeenCalledTimes(1)
    expect(queryText(0)).not.toContain('sync_state')
  })
})
