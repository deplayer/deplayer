import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { appStoreFor, makeTestStore, type TestLiveStore } from '../../../test-utils/liveStore'
import { events } from '../schema'
import { useRecentlyPlayed, useSearchMediaIds } from './useMedia'

let store: TestLiveStore

vi.mock('../store', () => ({ useAppStore: () => appStoreFor(store) }))

const addMedia = (id: string, title: string, artistName: string) =>
  store.commit(
    events.mediaAdded({
      id,
      title,
      artist: { id: `artist-${artistName}`, name: artistName },
      album: { id: 'album-1', name: 'Album', artistId: `artist-${artistName}` },
      type: 'audio',
      stream: {},
      genres: [],
    }),
  )

describe('LiveStore media hooks against real query shapes', () => {
  beforeEach(async () => {
    store = await makeTestStore()
    addMedia('m1', 'Blue Song', 'Red Band')
    addMedia('m2', 'Green Song', 'Blue Band')
    addMedia('m3', 'Yellow', 'Other')
  })

  afterEach(async () => {
    await store.shutdownPromise()
  })

  it('useSearchMediaIds merges title and artist matches without duplicates', () => {
    const { result } = renderHook(() => useSearchMediaIds('blue'))
    expect([...result.current].sort()).toEqual(['m1', 'm2'])
  })

  it('useRecentlyPlayed returns played tracks newest first, once each', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      for (const [id, at] of [['m1', 1000], ['m2', 2000], ['m1', 3000]] as const) {
        vi.setSystemTime(at)
        store.commit(events.mediaPlayed({ id }))
      }
    } finally {
      vi.useRealTimers()
    }

    const { result } = renderHook(() => useRecentlyPlayed())
    expect(result.current.map((m) => m.id)).toEqual(['m1', 'm2'])
  })
})
