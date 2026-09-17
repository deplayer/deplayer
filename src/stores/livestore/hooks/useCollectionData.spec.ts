import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

// The store must be referentially stable: the snapshot effect keys on it.
const storeQuery = vi.fn()
const useQuery = vi.fn()
const storeInstance = { query: storeQuery, useQuery }

vi.mock('../store', () => ({
  useAppStore: () => storeInstance,
}))
vi.mock('./useFavorites', () => {
  // Referentially stable: the real hook memoizes its LiveStore-derived Set.
  const favoriteIds = new Set<string>()
  return { useFavoriteIds: () => favoriteIds }
})

// Mutable so a test can change the search term and force a new window.
const mockUiState: { activeFilters: Record<string, unknown>; searchTerm: string } = {
  activeFilters: { artists: [], types: [], genres: [], providers: [], favorites: false },
  searchTerm: '',
}

vi.mock('../../uiStore', () => ({
  useUIStore: (sel: (s: unknown) => unknown) => sel(mockUiState),
}))

import { useCollectionData, COLLECTION_WINDOW_STEP } from './useCollectionData'

/** Raw row shape as SQLite returns it (JSON fields still strings). */
const rawRow = (id: string, title = `Song ${id}`) => ({
  id,
  title,
  track: 1,
  artistId: 'a1',
  artistName: 'Artist',
  albumId: 'al1',
  albumName: 'Album',
  duration: 100,
  cover: null,
  stream: '{}',
  type: 'audio',
  genresFlat: 'Rock',
  providersFlat: 'sub',
})

/** Queue one resolved value per store.query call; default to empty. */
const queueQueryResults = (results: unknown[][]) => {
  const queue = [...results]
  storeQuery.mockImplementation(() => Promise.resolve(queue.shift() ?? []))
}

const setup = (queryResults: unknown[][], countResult: unknown = [{ count: 0 }]) => {
  queueQueryResults(queryResults)
  useQuery.mockReturnValue(countResult)
}

/** Executor form: the tsconfig lib target predates Promise.withResolvers. */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(r => { resolve = r })
  return { promise, resolve }
}

describe('useCollectionData', () => {
  beforeEach(() => {
    storeQuery.mockReset()
    useQuery.mockReset()
    mockUiState.searchTerm = ''
  })

  it('loads the first window as a snapshot with live count and growth flag', async () => {
    setup([[rawRow('m1'), rawRow('m2')]], [{ count: 1234 }])

    const { result } = renderHook(() => useCollectionData())

    await waitFor(() => expect(result.current.fetching).toBe(false))
    expect(result.current.ids).toEqual(['m1', 'm2'])
    expect(result.current.map['m1']?.title).toBe('Song m1')
    expect(result.current.count).toBe(1234)
    expect(result.current.hasMore).toBe(true)
  })

  it('drops rows that fail decode instead of yielding undefined ids', async () => {
    setup([[null, rawRow('m1'), undefined]])

    const { result } = renderHook(() => useCollectionData())

    await waitFor(() => expect(result.current.fetching).toBe(false))
    expect(result.current.ids).toEqual(['m1'])
  })

  it('reports an empty collection with no more pages', async () => {
    setup([[]], [{ count: 0 }])

    const { result } = renderHook(() => useCollectionData())

    await waitFor(() => expect(result.current.fetching).toBe(false))
    expect(result.current.ids).toEqual([])
    expect(result.current.count).toBe(0)
    expect(result.current.hasMore).toBe(false)
  })

  it('grow() refetches with a larger window and keeps the loaded prefix', async () => {
    setup([
      [rawRow('m1'), rawRow('m2')],
      [rawRow('m1'), rawRow('m2'), rawRow('m3')],
    ], [{ count: 3 }])

    const { result } = renderHook(() => useCollectionData())
    await waitFor(() => expect(result.current.ids).toEqual(['m1', 'm2']))
    expect(result.current.hasMore).toBe(true)

    await act(async () => {
      result.current.grow()
    })

    await waitFor(() => expect(result.current.ids).toEqual(['m1', 'm2', 'm3']))
    // The second fetch must widen the window by one step.
    const secondQuery = storeQuery.mock.calls[1]?.[0] as { label?: string } | undefined
    expect(secondQuery?.label).toContain(`LIMIT ${COLLECTION_WINDOW_STEP * 2}`)
    expect(result.current.hasMore).toBe(false)
  })

  it('resolveAllIds() returns every matching id as a one-shot query', async () => {
    setup([[rawRow('m1')]], [{ count: 2 }])
    storeQuery.mockImplementation((query: { label?: string }) =>
      Promise.resolve(
        query?.label?.includes('COUNT(') ? [] : [{ id: 'm1' }, { id: 'm2' }],
      ),
    )

    const { result } = renderHook(() => useCollectionData())
    await waitFor(() => expect(result.current.fetching).toBe(false))

    let allIds: string[] = []
    await act(async () => {
      allIds = await result.current.resolveAllIds()
    })
    expect(allIds).toEqual(['m1', 'm2'])
    // The all-ids query is unbounded (no LIMIT) and ordered for shuffle parity.
    const allIdsCall = storeQuery.mock.calls
      .map(call => call[0] as { label?: string })
      .find(q => q.label?.includes('SELECT m.id AS id'))
    expect(allIdsCall?.label).toContain('ORDER BY m.title ASC, m.id ASC')
    expect(allIdsCall?.label).not.toContain('LIMIT')
  })

  it('a rapid filter change never lands a stale window over a newer one', async () => {
    // Executor form: the tsconfig lib target predates Promise.withResolvers.
    const first = deferred<unknown[]>()
    const second = deferred<unknown[]>()
    storeQuery.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    useQuery.mockReturnValue([{ count: 2 }])

    const { result, rerender } = renderHook(() => useCollectionData())
    // First fetch is in flight; change the search term so the next render
    // plans a different window (new query identity, effect re-runs).
    await act(async () => { await Promise.resolve() })
    mockUiState.searchTerm = 'other'
    await act(async () => { rerender() })

    // The stale fetch resolves after it was cancelled — it must not land.
    first.resolve([rawRow('stale')])
    second.resolve([rawRow('fresh')])
    await waitFor(() => expect(result.current.fetching).toBe(false))
    expect(result.current.ids).toEqual(['fresh'])
  })
})
