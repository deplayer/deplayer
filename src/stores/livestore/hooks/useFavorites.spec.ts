import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { appStoreFor, makeTestStore, type TestLiveStore } from '../../../test-utils/liveStore'
import { toggleFavoriteAction } from '../actions/favorites'
import { useFavoriteIds } from './useFavorites'

let store: TestLiveStore

vi.mock('../store', () => ({ useAppStore: () => appStoreFor(store) }))

describe('useFavoriteIds', () => {
  beforeEach(async () => {
    store = await makeTestStore()
  })

  afterEach(async () => {
    await store.shutdownPromise()
  })

  it('contains media ids favorited via toggleFavoriteAction and drops them on second toggle', () => {
    toggleFavoriteAction(store, 'media-1')
    toggleFavoriteAction(store, 'media-2')

    const { result, rerender } = renderHook(() => useFavoriteIds())
    expect(result.current).toEqual(new Set(['media-1', 'media-2']))

    toggleFavoriteAction(store, 'media-1')
    rerender()
    expect(result.current).toEqual(new Set(['media-2']))
  })

  it('returns an empty set when skipped', () => {
    toggleFavoriteAction(store, 'media-1')
    const { result } = renderHook(() => useFavoriteIds(true))
    expect(result.current.size).toBe(0)
  })
})
