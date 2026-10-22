import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { appStoreFor, makeTestStore, type TestLiveStore } from '../../../test-utils/liveStore'
import { playAllAction } from './actions'
import { useCurrentPlayingSongId, useQueue } from './hooks'

let store: TestLiveStore

vi.mock('../store', () => ({ useAppStore: () => appStoreFor(store) }))

describe('queue hooks against real query shapes', () => {
  beforeEach(async () => {
    store = await makeTestStore()
  })

  afterEach(async () => {
    await store.shutdownPromise()
  })

  it('useCurrentPlayingSongId is null with no queue, then the playing track id', async () => {
    const { result, rerender } = renderHook(() => useCurrentPlayingSongId())
    expect(result.current).toBeNull()

    await playAllAction(store, ['a', 'b'])
    rerender()
    expect(result.current).toBe('a')
  })

  it('useQueue assembles the ordered track list', async () => {
    await playAllAction(store, ['a', 'b', 'c'])
    const { result } = renderHook(() => useQueue())
    expect(result.current?.trackIds).toEqual(['a', 'b', 'c'])
  })
})
