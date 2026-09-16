import { useAppStore } from '../store'
import { useMemo } from 'react'
import { useUIStore } from '../../uiStore'
import { useFavoriteIds } from './useFavorites'
import { planCollectionQuery, parseIds } from '../collection/filter'
import { rawToMediaRow } from '../transformMedia'
import type { MediaRow } from '../../../types/media'

/**
 * Single optimized reactive query for collection data.
 *
 * A thin adapter over the collection-filter module: it plans the query
 * (path selection, clauses, post-filter) and executes the plan. All match
 * semantics live in `collection/filter.ts`.
 *
 * Both useQuery hooks stay mounted; the plan provides an inactive twin so
 * the inactive subscription is guaranteed-empty (Rules of Hooks).
 *
 * @returns Object with filtered IDs and media map (map only for the rows path)
 *
 * @example
 * ```tsx
 * const { ids, map } = useCollectionData()
 * return <MusicTable tableIds={ids} mediaMap={map} />
 * ```
 */
export const useCollectionData = () => {
  const store = useAppStore()
  const filters = useUIStore(s => s.activeFilters)
  const searchTerm = useUIStore(s => s.searchTerm)
  const favoriteIds = useFavoriteIds()
  const favoriteIdsArray = useMemo(() => Array.from(favoriteIds), [favoriteIds])

  // The uiStore activeFilters is a new object on every mutation, so its
  // identity is the plan memo key; the plan itself is pure.
  const plan = useMemo(
    () => planCollectionQuery(filters, searchTerm, favoriteIdsArray),
    [filters, searchTerm, favoriteIdsArray],
  )
  const activeRaw = store.useQuery(plan.activeQuery as Parameters<typeof store.useQuery>[0])
  const inactiveRaw = store.useQuery(plan.inactiveQuery as Parameters<typeof store.useQuery>[0])
  void inactiveRaw // subscription only: keeps the twin slot mounted and empty

  return useMemo(() => {
    const ids = parseIds(activeRaw)

    if (plan.kind !== 'rows') {
      return { ids, map: undefined as Record<string, MediaRow> | undefined }
    }

    const map: Record<string, MediaRow> = {}
    const rows = Array.isArray(activeRaw) ? activeRaw : []
    const resultIds: string[] = []
    for (const raw of rows as Record<string, unknown>[]) {
      if (!plan.postFilter(raw)) continue
      const row = rawToMediaRow(raw)
      if (!row) continue
      resultIds.push(row.id)
      map[row.id] = row
    }
    return { ids: resultIds, map }
  }, [plan, activeRaw])
}
