# Fix Main Thread Blocking Queries — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate main thread blocking caused by full-table scans in LiveStore hooks, replacing them with scoped SQL queries and lazy computation.

**Architecture:** Each offending hook does an unfiltered `SELECT *` on the media or artists table, then processes results in JS. The fix is to push filtering/limiting into SQL wherever possible, and restructure hooks that exist only to build lookup maps so they query only the data they need. No new dependencies — just better queries.

**Tech Stack:** LiveStore (`@livestore/livestore` queryDb), React hooks, Vitest

---

## Task 1: Scope `useRecommendations` query with genre-based SQL filter

The worst offender. Loads **every row** from media just to find ~15 genre-matching songs.

**Files:**
- Modify: `src/stores/livestore/hooks/useRecommendations.ts`
- Test: `src/stores/livestore/hooks/useRecommendations.spec.ts` (create)

**Step 1: Write the failing test**

Create `src/stores/livestore/hooks/useRecommendations.spec.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getLocalRecommendations } from '../../../services/Recommendations/RecommendationService'

// RecommendationService is pure — test the filtering logic in isolation
describe('getLocalRecommendations', () => {
  const library = [
    { id: '1', artistId: 'a1', artistName: 'A1', genres: ['rock', 'indie'], playCount: 10 },
    { id: '2', artistId: 'a2', artistName: 'A2', genres: ['rock'], playCount: 5 },
    { id: '3', artistId: 'a3', artistName: 'A3', genres: ['jazz'], playCount: 20 },
    { id: '4', artistId: 'a1', artistName: 'A1', genres: ['rock'], playCount: 3 }, // same artist as source
  ]

  it('excludes source artist and matches genres', () => {
    const result = getLocalRecommendations({
      sourceArtistId: 'a1',
      sourceGenres: ['rock'],
      library,
      limit: 10,
    })
    expect(result.map(r => r.id)).toEqual(['2'])
    expect(result.find(r => r.artistId === 'a1')).toBeUndefined()
  })
})
```

**Step 2: Run test to verify it passes (baseline for service logic)**

Run: `npm test -- src/stores/livestore/hooks/useRecommendations.spec.ts`
Expected: PASS — this validates the service works so we can safely change the hook.

**Step 3: Modify the hook to use a scoped query**

In `src/stores/livestore/hooks/useRecommendations.ts`, replace the unfiltered query:

```ts
// BEFORE (loads entire library):
const library = store.useQuery(
  queryDb(
    tables.media
      .select('id', 'title', 'artistId', 'artistName', 'genresFlat', 'playCount', 'cover')
      .orderBy('playCount', 'desc')
  )
)

// AFTER (exclude source artist at SQL level, limit candidate pool):
const query = useMemo(() => {
  if (!artistId) return tables.media.select('id').where('id', '=', '__NONE__')
  return tables.media
    .select('id', 'title', 'artistId', 'artistName', 'genresFlat', 'playCount', 'cover')
    .where({ artistId: { op: '!=', value: artistId } })
    .orderBy('playCount', 'desc')
    .limit(200) // Cap candidate pool — genre matching picks best 15 from these
}, [artistId])

const library = store.useQuery(queryDb(query))
```

This cuts the dataset from N (entire library) to max 200 rows, and excludes the source artist at SQL level instead of JS.

**Step 4: Run lint and existing tests**

Run: `npm run lint && npm test`
Expected: All pass.

**Step 5: Commit**

```bash
jj describe -m "perf: scope useRecommendations query to exclude source artist + limit 200"
jj new
```

---

## Task 2: Replace `useArtistsMap` in RecentAlbums with targeted artist lookup

`RecentAlbums` fetches 10 albums, then loads ALL artists into a map just to resolve 10 artist names.

**Files:**
- Modify: `src/components/Dashboard/RecentAlbums.tsx`
- Modify: `src/stores/livestore/hooks/useArtists.ts` (add `useArtistsByIds`)
- Test: `src/components/Dashboard/RecentAlbums.spec.tsx` (create if not exists)

**Step 1: Add a targeted `useArtistsByIds` hook**

In `src/stores/livestore/hooks/useArtists.ts`, add:

```ts
/**
 * Get artists by a list of IDs (for targeted lookups instead of loading all artists)
 */
export const useArtistsByIds = (ids: string[]) => {
  const store = useAppStore()
  
  const query = useMemo(() => {
    if (!ids.length) return tables.artists.select().where('id', '=', '__NONE__')
    return tables.artists.select().where({ id: { op: 'IN', value: ids } })
  }, [ids])
  
  const result = store.useQuery(queryDb(query))
  
  return useMemo(() => {
    const map: Record<string, any> = {}
    if (Array.isArray(result)) {
      result.forEach((artist: any) => { map[artist.id] = artist })
    }
    return map
  }, [result])
}
```

Export it from `src/stores/livestore/hooks/index.ts`.

**Step 2: Update RecentAlbums to use the scoped hook**

In `src/components/Dashboard/RecentAlbums.tsx`:

```ts
// BEFORE:
import { useRecentAlbums, useArtistsMap } from '../../stores/livestore/hooks'
// ...
const artistsMap = useArtistsMap()  // loads ALL artists

// AFTER:
import { useRecentAlbums, useArtistsByIds } from '../../stores/livestore/hooks'
// ...
const artistIds = useMemo(
  () => [...new Set((recentAlbums as any[]).map(a => a.artistId).filter(Boolean))],
  [recentAlbums]
)
const artistsMap = useArtistsByIds(artistIds)  // loads only the ~10 relevant artists
```

**Step 3: Run lint and tests**

Run: `npm run lint && npm test`
Expected: All pass.

**Step 4: Commit**

```bash
jj describe -m "perf: RecentAlbums uses targeted artist lookup instead of full table scan"
jj new
```

---

## Task 3: Move search term filtering to SQL in `useCollectionData`

The search filter runs `.toLowerCase().includes()` on every row client-side. SQLite's `LIKE` is case-insensitive for ASCII and handles this at the DB level.

**Files:**
- Modify: `src/stores/livestore/hooks/useCollectionData.ts`

**Step 1: Move search into the SQL query builder**

In `useCollectionData.ts`, inside the `useMemo` that builds the query:

```ts
// ADD inside the query builder, before the return:
if (searchTerm && searchTerm.length >= 3) {
  const likeTerm = `%${searchTerm}%`
  // Use OR across title, artistName, albumName via chained where
  // LiveStore supports LIKE operator for text matching
  baseQuery = baseQuery.where({ title: { op: 'LIKE', value: likeTerm } })
  // NOTE: If LiveStore doesn't support OR in where(), keep client-side for now
  // and document as a follow-up. Check LiveStore docs first.
}
```

**Important:** Check LiveStore docs for OR support before implementing:
```bash
cat node_modules/@livestore/livestore/docs/queries.md
```

If LiveStore doesn't support OR in WHERE clauses, the alternative is to keep client-side search but add `.limit(500)` to the base query to cap the processing, or use a single `LIKE` on a concatenated column (less ideal).

**Step 2: Remove the client-side search filter block**

Remove or gate the `searchTerm` block in the `useMemo` that processes `rawMedia`:

```ts
// Remove this block if SQL handles it:
if (searchTerm && searchTerm.length >= 3) {
  const lowerSearch = searchTerm.toLowerCase()
  // ...
}
```

**Step 3: Add searchTerm to the query useMemo deps**

```ts
}, [filters.artists, filters.types, filters.favorites, favoriteIdsArray, searchTerm])
//                                                                        ^^^^^^^^^^
```

**Step 4: Run lint and tests**

Run: `npm run lint && npm test`
Expected: All pass.

**Step 5: Commit**

```bash
jj describe -m "perf: move search term filtering to SQL LIKE in useCollectionData"
jj new
```

---

## Task 4: Audit and remove/deprecate remaining full-scan hooks

Several hooks load the entire media table to build grouping maps. Some are unused, some have optimized alternatives already.

**Files:**
- Modify: `src/stores/livestore/hooks/useAlbums.ts`
- Modify: `src/stores/livestore/hooks/useArtists.ts`
- Modify: `src/stores/livestore/hooks/index.ts`

**Step 1: Check usage of full-scan hooks**

Run:
```bash
grep -r "useSongsByAlbum[^F]" src/ --include="*.ts" --include="*.tsx" -l
grep -r "useSongsByArtist" src/ --include="*.ts" --include="*.tsx" -l
grep -r "useArtistsMap" src/ --include="*.ts" --include="*.tsx" -l
```

For each consumer found:
- If the consumer only needs data for a **specific ID** → replace with the scoped variant (`useSongsByAlbumForArtist`, `useArtistsByIds`, `useArtistById`)
- If the consumer genuinely needs all data → add a deprecation comment and a `// TODO: paginate or virtualize` note

**Step 2: Add deprecation warnings**

For hooks that remain but are dangerous:

```ts
/**
 * @deprecated Use useSongsByAlbumForArtist(artistId) instead.
 * ⚠️ PERFORMANCE: Loads entire media table. Only use if you truly need all songs grouped.
 */
export const useSongsByAlbum = () => { ... }
```

**Step 3: Run knip to find any now-unused hooks**

Run: `npm run knip`

Remove any hooks that have zero consumers after the refactors.

**Step 4: Run full test suite**

Run: `npm test`
Expected: All pass.

**Step 5: Commit**

```bash
jj describe -m "perf: deprecate full-scan hooks, migrate consumers to scoped queries"
jj new
```

---

## Task 5: Verify no regressions end-to-end

**Step 1: Run full quality check**

```bash
npm run lint
npm test
npm run build
```

All must pass.

**Step 2: Manual smoke test**

1. Open the app with `npm run dev`
2. Add some media / use demo data
3. Navigate to Dashboard — "Because you listened to" and "Recent Albums" should load without jank
4. Navigate to Collection — filtering and search should feel responsive
5. Perform a search — results should appear without blocking

**Step 3: Final commit**

```bash
jj describe -m "perf: fix main thread blocking from full-table LiveStore queries"
```

---

## Summary of changes

| Hook | Before | After |
|------|--------|-------|
| `useRecommendations` | `SELECT * FROM media` (all rows) | `SELECT ... WHERE artistId != ? LIMIT 200` |
| `useArtistsMap` (in RecentAlbums) | `SELECT * FROM artists` (all rows) | `SELECT * FROM artists WHERE id IN (...)` (10 rows) |
| `useCollectionData` search | Client-side `.includes()` on all rows | SQL `LIKE` (if supported) or capped candidate set |
| `useSongsByAlbum` | Full scan, no deprecation | Deprecated, consumers migrated to scoped variant |
| `useSongsByArtist` | Full scan | Deprecated, consumers migrated |
