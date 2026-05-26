import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const useQuery = vi.fn(() => [])
vi.mock('../store', () => ({ useAppStore: () => ({ useQuery }) }))
vi.mock('./useFavorites', () => ({ useFavoriteIds: () => new Set<string>() }))

import { useSearchMediaIds, useMediaMapForIds, useSearchMedia } from './useMedia'

describe('useMedia idle subscriptions', () => {
  beforeEach(() => useQuery.mockClear())

  it('useSearchMediaIds("") does NOT call store.useQuery', () => {
    const { result } = renderHook(() => useSearchMediaIds(''))
    expect(result.current).toEqual([])
    expect(useQuery).not.toHaveBeenCalled()
  })

  it('useSearchMediaIds("   ") (whitespace) does NOT call store.useQuery', () => {
    const { result } = renderHook(() => useSearchMediaIds('   '))
    expect(result.current).toEqual([])
    expect(useQuery).not.toHaveBeenCalled()
  })

  it('useMediaMapForIds([]) does NOT call store.useQuery', () => {
    const { result } = renderHook(() => useMediaMapForIds([]))
    expect(result.current).toEqual({})
    expect(useQuery).not.toHaveBeenCalled()
  })

  it('useSearchMedia("") does NOT call store.useQuery', () => {
    const { result } = renderHook(() => useSearchMedia(''))
    expect(result.current).toEqual([])
    expect(useQuery).not.toHaveBeenCalled()
  })
})
