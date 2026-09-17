import { useAppStore } from '../store'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useUIStore } from '../../uiStore'
import { useFavoriteIds } from './useFavorites'
import {
  buildCollectionClauses,
  collectionAllIdsQuery,
  collectionCountQuery,
  collectionWindowQuery,
  parseIds,
} from '../collection/filter'
import { rawToMediaRow } from '../transformMedia'
import type { MediaRow } from '../../../types/media'

/** Rows in the first window (and the growth step for subsequent windows). */
export const COLLECTION_WINDOW_STEP = 250

export interface CollectionData {
  /** Snapshot ids (window-bounded, ordered by title then id). */
  ids: string[]
  /** Snapshot rows as an id-keyed map — same rows, for prop fast paths. */
  map: Record<string, MediaRow>
  /** Live count for the current clauses (undefined until the query lands). */
  count: number | undefined
  /** True while a (re)fetch of the window is in flight. */
  fetching: boolean
  /** Whether the window can grow further (count known and beyond the window). */
  hasMore: boolean
  /** Grow the window by one step and refetch. */
  grow: () => void
  /** One-shot all matching ids (Play All / Play Next semantics). */
  resolveAllIds: () => Promise<string[]>
}

/**
 * Windowed collection data over the collection-filter module.
 *
 * The window is a snapshot: refetched on filter/search change or growth,
 * never on sync commits — provider sync cannot shift rows under the user's
 * scroll position. The count is a separate live query, so sync ticks update
 * the number cheaply without touching the row snapshot at all.
 *
 * @returns Windowed ids/map plus the live count and window controls
 *
 * @example
 * ```tsx
 * const { ids, map, count, hasMore, grow } = useCollectionData()
 * return <MusicTable tableIds={ids} mediaMap={map} total={count} hasMore={hasMore} onLoadMore={grow} />
 * ```
 */
export const useCollectionData = (): CollectionData => {
  const store = useAppStore()
  const filters = useUIStore(s => s.activeFilters)
  const searchTerm = useUIStore(s => s.searchTerm)
  const favoriteIds = useFavoriteIds()
  const favoriteIdsArray = useMemo(() => Array.from(favoriteIds), [favoriteIds])

  // The uiStore activeFilters is a new object on every mutation, so its
  // identity is the clause memo key; the clause builder itself is pure.
  const clauses = useMemo(
    () => buildCollectionClauses(filters, searchTerm, favoriteIdsArray),
    [filters, searchTerm, favoriteIdsArray],
  )

  const [limit, setLimit] = useState(COLLECTION_WINDOW_STEP)
  const [rows, setRows] = useState<MediaRow[]>([])
  const [fetching, setFetching] = useState(true)

  // Memoized query objects keep identity stable across renders (useQuery
  // keys its subscription by query identity).
  const windowQuery = useMemo(() => collectionWindowQuery(clauses, limit), [clauses, limit])
  const countQuery = useMemo(() => collectionCountQuery(clauses), [clauses])
  const allIdsQuery = useMemo(() => collectionAllIdsQuery(clauses), [clauses])

  // Snapshot fetch: cancellation-guarded so a rapid filter change can never
  // land a stale window over a newer one.
  useEffect(() => {
    let cancelled = false
    setFetching(true)
    // store.query's typing resolves sync-or-async depending on query kind,
    // so await inside an IIFE instead of chaining .then on a maybe-promise.
    void (async () => {
      try {
        const raw: unknown = await store.query(windowQuery)
        if (cancelled) return
        const next: MediaRow[] = []
        const list = Array.isArray(raw) ? raw : []
        for (const item of list) {
          const row = rawToMediaRow(item)
          if (row) next.push(row)
        }
        setRows(next)
        setFetching(false)
      } catch {
        if (cancelled) return
        setRows([])
        setFetching(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [store, windowQuery])

  // Live count — the only subscribed query, so sync ticks stay O(aggregate).
  const countRaw = store.useQuery(countQuery as Parameters<typeof store.useQuery>[0])
  const count = useMemo(() => {
    // The count schema decodes to [{ count }]; tolerate a bare row or a
    // plain number in case LiveStore's decoding shape shifts.
    if (typeof countRaw === 'number') return countRaw
    if (Array.isArray(countRaw)) {
      const first = countRaw[0]
      if (first && typeof first === 'object' && 'count' in first) {
        const value = first.count
        return typeof value === 'number' ? value : undefined
      }
      return undefined
    }
    if (countRaw && typeof countRaw === 'object' && 'count' in countRaw) {
      const value = countRaw.count
      return typeof value === 'number' ? value : undefined
    }
    return undefined
  }, [countRaw])

  const ids = useMemo(() => rows.map(r => r.id), [rows])
  const map = useMemo(() => {
    const m: Record<string, MediaRow> = {}
    for (const row of rows) m[row.id] = row
    return m
  }, [rows])

  const grow = useCallback(() => setLimit(l => l + COLLECTION_WINDOW_STEP), [])

  const resolveAllIds = useCallback(async (): Promise<string[]> => {
    try {
      return parseIds(await store.query(allIdsQuery))
    } catch {
      return []
    }
  }, [store, allIdsQuery])

  const hasMore = count !== undefined ? ids.length < count : false

  return { ids, map, count, fetching, hasMore, grow, resolveAllIds }
}
