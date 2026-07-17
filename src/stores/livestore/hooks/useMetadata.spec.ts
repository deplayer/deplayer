import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// Capture what useQuery returns
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

import { useAvailableGenres, useAvailableProviders, useAvailableTypes } from './useMetadata'

function setup(queries: unknown[]) {
  useQueryReturns.length = 0
  for (const q of queries) useQueryReturns.push(q)
  callIndex = 0
  useQuery.mockClear()
}

describe('useAvailableGenres', () => {
  beforeEach(() => {
    setup([])
  })

  it('returns sorted unique genres from query results', () => {
    setup([
      [{ value: 'Rock' }, { value: 'Jazz' }, { value: 'Pop' }],
    ])

    const { result } = renderHook(() => useAvailableGenres())

    expect(result.current).toEqual(['Jazz', 'Pop', 'Rock'])
  })

  it('trims and filters empty genre values', () => {
    setup([
      [{ value: '  Rock  ' }, { value: 'Jazz' }, { value: '' }, { value: '  ' }],
    ])

    const { result } = renderHook(() => useAvailableGenres())

    expect(result.current).toEqual(['Jazz', 'Rock'])
  })

  it('handles empty results', () => {
    setup([[]])

    const { result } = renderHook(() => useAvailableGenres())

    expect(result.current).toEqual([])
  })

  it('handles non-array results gracefully', () => {
    setup([null])

    const { result } = renderHook(() => useAvailableGenres())

    expect(result.current).toEqual([])
  })
})

describe('useAvailableProviders', () => {
  beforeEach(() => {
    setup([])
  })

  it('returns sorted unique providers from comma-separated values', () => {
    setup([
      [{ value: 'jellyfin,subsonic' }, { value: 'youtube' }, { value: 'jellyfin,spotify' }],
    ])

    const { result } = renderHook(() => useAvailableProviders())

    expect(result.current).toEqual(['jellyfin', 'spotify', 'subsonic', 'youtube'])
  })

  it('handles empty results', () => {
    setup([[]])

    const { result } = renderHook(() => useAvailableProviders())

    expect(result.current).toEqual([])
  })

  it('handles non-array results gracefully', () => {
    setup([null])

    const { result } = renderHook(() => useAvailableProviders())

    expect(result.current).toEqual([])
  })

  it('trims whitespace from split values', () => {
    setup([
      [{ value: ' jellyfin , subsonic ' }, { value: '  youtube' }],
    ])

    const { result } = renderHook(() => useAvailableProviders())

    expect(result.current).toEqual(['jellyfin', 'subsonic', 'youtube'])
  })
})

describe('useAvailableTypes', () => {
  beforeEach(() => {
    setup([])
  })

  it('returns sorted unique media types', () => {
    setup([
      [{ value: 'video' }, { value: 'audio' }, { value: 'audio' }],
    ])

    const { result } = renderHook(() => useAvailableTypes())

    expect(result.current).toEqual(['audio', 'video'])
  })

  it('trims type values', () => {
    setup([
      [{ value: ' audio ' }, { value: 'video' }],
    ])

    const { result } = renderHook(() => useAvailableTypes())

    expect(result.current).toEqual(['audio', 'video'])
  })

  it('handles empty results', () => {
    setup([[]])

    const { result } = renderHook(() => useAvailableTypes())

    expect(result.current).toEqual([])
  })

  it('handles non-array results gracefully', () => {
    setup([null])

    const { result } = renderHook(() => useAvailableTypes())

    expect(result.current).toEqual([])
  })
})
