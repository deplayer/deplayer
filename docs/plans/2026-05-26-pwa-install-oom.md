# PWA Install OOM Fix — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Stop the renderer OOM that crashes Chromium PWA installs of deplayer by bounding first-sync memory peaks and eliminating the reactive-invalidation storm during hydration.

**Architecture:** Replace the provider's unbounded `getNewestAlbumsSince` / `getAlbumsBatch` pair with one streaming `AsyncGenerator` driven by a single saga loop. Make `BatchedMediaCommitter` bounded on ingress, swap-not-spread on flush, and chunk the existence-check SQL. Delete the phantom `NOOP_QUERY` subscription so `sync_state` writes during hydration don't re-trigger every idle hook.

**Tech Stack:** TypeScript, React 18, Redux Toolkit, redux-saga, LiveStore v0.4 (wa-sqlite + OPFS), Vitest, axios.

**Design doc:** `docs/plans/2026-05-26-pwa-install-oom-design.md`

---

## Pre-flight

Before Task 1, read the design doc and `src/sagas/collection/index.ts` end-to-end so the saga rewrite isn't surprising. Confirm `npm test -- --run` is green on `master` (baseline).

```bash
git status        # clean
npm test -- --run # baseline passes
```

---

### Task 1: BatchedMediaCommitter — bounded `add()`

**Files:**
- Modify: `src/stores/livestore/services/BatchedMediaCommitter.ts:78-101`
- Test: `src/stores/livestore/services/BatchedMediaCommitter.spec.ts` (NEW)

**Step 1: Write the failing test**

```ts
// src/stores/livestore/services/BatchedMediaCommitter.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { batchedMediaCommitter } from './BatchedMediaCommitter'
import type { NormalizedMedia } from '../../../utils/normalizeMedia'

const makeMedia = (n: number): NormalizedMedia[] =>
  Array.from({ length: n }, (_, i) => ({
    media: { id: `m${i}`, title: `t${i}`, type: 'audio', stream: {}, genres: [] },
    artist: { id: `a${i}`, name: `A${i}` },
    album: { id: `al${i}`, name: `AL${i}`, artistId: `a${i}`, thumbnailUrl: null, year: null },
  })) as unknown as NormalizedMedia[]

const makeFakeStore = () => ({
  query: vi.fn(async () => [{ values: [] as string[][] }]),
  commit: vi.fn(async () => undefined),
  manualRefresh: vi.fn(),
})

describe('BatchedMediaCommitter.add', () => {
  beforeEach(() => batchedMediaCommitter.clear())

  it('never lets pendingMedia exceed MAX_BATCH_SIZE before flushing', async () => {
    const store = makeFakeStore()
    // @ts-expect-error test seam
    batchedMediaCommitter.setStore(store)

    const peeks: number[] = []
    const origFlush = batchedMediaCommitter.flush.bind(batchedMediaCommitter)
    vi.spyOn(batchedMediaCommitter, 'flush').mockImplementation(async () => {
      peeks.push(batchedMediaCommitter.getPendingCount())
      return origFlush()
    })

    await batchedMediaCommitter.add(makeMedia(5000))
    await batchedMediaCommitter.flush()

    expect(Math.max(...peeks)).toBeLessThanOrEqual(500)
  })
})
```

**Step 2: Run to verify it fails**

```bash
npm test -- --run src/stores/livestore/services/BatchedMediaCommitter.spec.ts
```
Expected: FAIL — current `add()` does `push(...mediaItems)` first, so the peek sees 5000.

**Step 3: Minimal implementation**

Replace the body of `add()` (lines ~80-101):

```ts
async add(mediaItems: NormalizedMedia[]): Promise<void> {
  if (!mediaItems || mediaItems.length === 0) return

  let i = 0
  while (i < mediaItems.length) {
    const room = this.MAX_BATCH_SIZE - this.pendingMedia.length
    const take = Math.min(room, mediaItems.length - i)
    if (take > 0) {
      // slice to avoid push(...) stack-overflow on huge arrays
      for (let k = 0; k < take; k++) this.pendingMedia.push(mediaItems[i + k])
      i += take
    }
    if (this.pendingMedia.length >= this.MAX_BATCH_SIZE) {
      await this.flush()
    }
  }

  if (this.flushTimeout) clearTimeout(this.flushTimeout)
  this.flushTimeout = window.setTimeout(() => { this.flush() }, this.THROTTLE_MS)
}
```

**Step 4: Run to verify it passes**

```bash
npm test -- --run src/stores/livestore/services/BatchedMediaCommitter.spec.ts
```
Expected: PASS.

**Step 5: Commit**

```bash
git add src/stores/livestore/services/BatchedMediaCommitter.ts src/stores/livestore/services/BatchedMediaCommitter.spec.ts
git commit -m "fix(committer): cap add() at MAX_BATCH_SIZE before push"
```

---

### Task 2: BatchedMediaCommitter — swap-not-spread + chunked existence query

**Files:**
- Modify: `src/stores/livestore/services/BatchedMediaCommitter.ts:151-210`
- Test: `src/stores/livestore/services/BatchedMediaCommitter.spec.ts`

**Step 1: Add failing tests**

Append to the spec:

```ts
describe('BatchedMediaCommitter.flush', () => {
  beforeEach(() => batchedMediaCommitter.clear())

  it('does not duplicate the buffer (swap, not spread)', async () => {
    const store = makeFakeStore()
    // @ts-expect-error test seam
    batchedMediaCommitter.setStore(store)

    await batchedMediaCommitter.add(makeMedia(100))
    // Force flush; observe that the buffer was emptied before any await
    const before = batchedMediaCommitter.getPendingCount()
    const p = batchedMediaCommitter.flush()
    expect(batchedMediaCommitter.getPendingCount()).toBe(0)
    expect(before).toBeGreaterThan(0)
    await p
  })

  it('chunks the existence SELECT into ≤500 placeholders per call', async () => {
    const store = makeFakeStore()
    // @ts-expect-error test seam
    batchedMediaCommitter.setStore(store)

    // Push 1200 items by bypassing add() bounds — feed flush() directly
    // by repeatedly adding under-threshold pages.
    for (let i = 0; i < 3; i++) {
      // @ts-expect-error test seam: bypass MAX_BATCH_SIZE for test
      batchedMediaCommitter.pendingMedia.push(...makeMedia(400))
    }
    await batchedMediaCommitter.flush()

    const queries = store.query.mock.calls.map(([{ query }]) => query as string)
    expect(queries.length).toBeGreaterThanOrEqual(3)
    for (const q of queries) {
      const placeholders = (q.match(/\?/g) || []).length
      expect(placeholders).toBeLessThanOrEqual(500)
    }
  })
})
```

**Step 2: Run to verify both fail**

```bash
npm test -- --run src/stores/livestore/services/BatchedMediaCommitter.spec.ts
```
Expected: FAIL — "does not duplicate" passes by accident if order is right, but "chunks the existence SELECT" fails (single query with 1200 placeholders).

**Step 3: Implementation**

Edit the top of `flush()` (the section that builds `mediaToCommit` and the existence query). Replace:

```ts
this.isCommitting = true
const mediaToCommit = [...this.pendingMedia]
this.pendingMedia = []
```

with:

```ts
this.isCommitting = true
const mediaToCommit = this.pendingMedia
this.pendingMedia = []
```

Then replace the existence-query block (the `placeholders`/`bindValues` reduce + single `store.query`) with:

```ts
const EXISTENCE_CHUNK = 500
const existingIds = new Set<string>()
for (let off = 0; off < mediaToCommit.length; off += EXISTENCE_CHUNK) {
  const slice = mediaToCommit.slice(off, off + EXISTENCE_CHUNK)
  const placeholders = slice.map(() => '?').join(',')
  const bindValues: Record<number, string> = {}
  for (let k = 0; k < slice.length; k++) bindValues[k + 1] = slice[k].media.id
  const result = await this.store!.query({
    query: `SELECT id FROM media WHERE id IN (${placeholders})`,
    bindValues,
  })
  const rows = (result as Array<{ values?: string[][] }>)?.[0]?.values || []
  for (const row of rows) existingIds.add(row[0])
}
```

**Step 4: Run to verify both pass**

```bash
npm test -- --run src/stores/livestore/services/BatchedMediaCommitter.spec.ts
```
Expected: PASS.

**Step 5: Commit**

```bash
git add src/stores/livestore/services/BatchedMediaCommitter.ts src/stores/livestore/services/BatchedMediaCommitter.spec.ts
git commit -m "fix(committer): swap-not-spread on flush; chunk existence query"
```

---

### Task 3: Provider interface — add `streamAlbumsSince`

**Files:**
- Modify: `src/providers/IMusicProvider.ts`

No tests in this step; types only. Type-checks land via Task 4.

**Step 1: Edit interface**

Replace the file body with:

```ts
import { NormalizedMedia } from '../utils/normalizeMedia'

export interface ScanStatus {
  scanning: boolean
  count: number
  lastScan: string
}

export interface AlbumPage {
  media: NormalizedMedia[]
  /** Opaque cursor for the next page (provider-specific). null when done. */
  nextCursor: string | null
  hasMore: boolean
}

export interface IMusicProvider {
  providerKey: string
  search(searchTerm: string): Promise<NormalizedMedia[]>
  getArtistSongs?(artistName: string): Promise<NormalizedMedia[]>
  getScanStatus?(): Promise<ScanStatus>
  /**
   * Stream album pages newer than `since`. Pass `null` for a first sync.
   * `cursor` resumes from a previous session's saved position.
   */
  streamAlbumsSince?(
    since: string | null,
    opts?: { cursor?: string | null; pageSize?: number },
  ): AsyncGenerator<AlbumPage, void, void>
}
```

**Step 2: Confirm typecheck breaks where expected**

```bash
npx tsc --noEmit
```
Expected: errors only in `src/sagas/collection/index.ts` (uses removed methods) and `src/providers/SubsonicApiProvider.ts` (still implements old methods). These get fixed in Tasks 4 and 6.

**Step 3: Commit interim**

```bash
git add src/providers/IMusicProvider.ts
git commit -m "feat(provider): add streamAlbumsSince to IMusicProvider"
```

---

### Task 4: SubsonicApiProvider — implement `streamAlbumsSince`

**Files:**
- Modify: `src/providers/SubsonicApiProvider.ts:103-189` (replaces `getNewestAlbumsSince` and `getAlbumsBatch`)
- Test: `src/providers/SubsonicApiProvider.streamAlbumsSince.spec.ts` (NEW)
- Delete: `src/providers/SubsonicApiProvider.getNewestAlbumsSince.spec.ts` (Task 7)

**Step 1: Failing test**

```ts
// src/providers/SubsonicApiProvider.streamAlbumsSince.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SubsonicApiProvider from './SubsonicApiProvider'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

const albumList = (albums: unknown[]) => ({
  data: { 'subsonic-response': { albumList2: { album: albums } } },
})
const albumDetail = (album: { id: string; year?: number }, songs: unknown[]) => ({
  data: { 'subsonic-response': { album: { ...album, song: songs } } },
})

describe('SubsonicApiProvider.streamAlbumsSince', () => {
  let provider: SubsonicApiProvider
  beforeEach(() => {
    vi.clearAllMocks()
    provider = new SubsonicApiProvider(
      { baseUrl: 'http://localhost', user: 'u', password: 'p' },
      'subsonic-1',
    )
  })

  it('yields page-sized chunks and stops at the `since` boundary', async () => {
    mockedAxios.get
      .mockResolvedValueOnce(albumList([
        { id: 'a1', created: '2026-03-18T00:00:00Z' },
        { id: 'a2', created: '2026-03-17T00:00:00Z' },
        { id: 'a3', created: '2026-03-10T00:00:00Z' }, // older than since
      ]))
      .mockResolvedValueOnce(albumDetail({ id: 'a1', year: 2026 }, [
        { id: 's1', title: 'S1', artist: 'A', album: 'Al1', duration: 1, track: 1 },
      ]))
      .mockResolvedValueOnce(albumDetail({ id: 'a2', year: 2026 }, [
        { id: 's2', title: 'S2', artist: 'A', album: 'Al2', duration: 1, track: 1 },
      ]))

    const pages: number[] = []
    for await (const page of provider.streamAlbumsSince('2026-03-15T00:00:00Z')) {
      pages.push(page.media.length)
      // Important: assert at most one page's worth of media is materialised at a time.
      // The generator is not allowed to buffer past the current yield.
    }
    expect(pages.reduce((a, b) => a + b, 0)).toBe(2)
  })

  it('first sync (since=null) walks until provider returns empty', async () => {
    mockedAxios.get
      .mockResolvedValueOnce(albumList([{ id: 'a1', created: '2026-03-18T00:00:00Z' }]))
      .mockResolvedValueOnce(albumDetail({ id: 'a1' }, [
        { id: 's1', title: 'S1', artist: 'A', album: 'Al1', duration: 1, track: 1 },
      ]))
      .mockResolvedValueOnce(albumList([])) // end

    const collected: string[] = []
    for await (const page of provider.streamAlbumsSince(null, { pageSize: 50 })) {
      for (const m of page.media) collected.push(m.media.title!)
    }
    expect(collected).toEqual(['S1'])
  })
})
```

**Step 2: Run to verify it fails**

```bash
npm test -- --run src/providers/SubsonicApiProvider.streamAlbumsSince.spec.ts
```
Expected: FAIL — method doesn't exist.

**Step 3: Implementation**

In `src/providers/SubsonicApiProvider.ts`, delete `getNewestAlbumsSince` and `getAlbumsBatch`, then add:

```ts
async *streamAlbumsSince(
  since: string | null,
  opts: { cursor?: string | null; pageSize?: number } = {},
): AsyncGenerator<{ media: NormalizedMedia[]; nextCursor: string | null; hasMore: boolean }, void, void> {
  const pageSize = opts.pageSize ?? 50
  const ALBUM_FETCH_PARALLELISM = 10
  let offset = Number.isFinite(Number(opts.cursor)) ? Number(opts.cursor) : 0
  const sinceMs = since ? new Date(since).getTime() : -Infinity

  while (true) {
    const list = await axios.get(
      `${this.baseUrl}/rest/getAlbumList2.view?u=${this.user}&p=${this.password}` +
      `&c=deplayer&v=1.16.1&f=json&type=newest&size=${pageSize}&offset=${offset}`,
    )
    const albums = list.data['subsonic-response'].albumList2?.album || []
    if (albums.length === 0) {
      yield { media: [], nextCursor: String(offset), hasMore: false }
      return
    }

    // Trim to the `since` boundary; bail out as soon as we cross it.
    let crossedBoundary = false
    const fresh: SubsonicAlbum[] = []
    for (const album of albums) {
      if (new Date(album.created!).getTime() > sinceMs) {
        fresh.push(album)
      } else {
        crossedBoundary = true
        break
      }
    }

    // Fetch song lists for this page only — never accumulate across pages.
    const pageMedia: NormalizedMedia[] = []
    for (let i = 0; i < fresh.length; i += ALBUM_FETCH_PARALLELISM) {
      const slice = fresh.slice(i, i + ALBUM_FETCH_PARALLELISM)
      const results = await Promise.allSettled(
        slice.map(async (album) => {
          const detail = await axios.get(
            `${this.baseUrl}/rest/getAlbum.view?u=${this.user}&p=${this.password}` +
            `&c=deplayer&v=1.16.1&f=json&id=${album.id}`,
          )
          const songs = detail.data['subsonic-response'].album?.song || []
          return { songs, album }
        }),
      )
      for (const r of results) {
        if (r.status === 'fulfilled') {
          for (const m of this.mapSongs(r.value.songs, [r.value.album])) pageMedia.push(m)
        } else {
          logger.error('Error fetching album songs:', r.reason)
        }
      }
    }

    const hasMore = !crossedBoundary && albums.length === pageSize
    offset += pageSize
    yield { media: pageMedia, nextCursor: hasMore ? String(offset) : null, hasMore }
    if (!hasMore) return
  }
}
```

**Step 4: Run to verify it passes**

```bash
npm test -- --run src/providers/SubsonicApiProvider.streamAlbumsSince.spec.ts
```
Expected: PASS.

**Step 5: Commit**

```bash
git add src/providers/SubsonicApiProvider.ts src/providers/SubsonicApiProvider.streamAlbumsSince.spec.ts
git commit -m "feat(subsonic): implement streamAlbumsSince generator"
```

---

### Task 5: `useMedia` — drop NOOP_QUERY, early-return on empty input

**Files:**
- Modify: `src/stores/livestore/hooks/useMedia.ts` (delete `NOOP_QUERY`; touch `useSearchMedia`, `useSearchMediaIds`, `useMediaMapForIds`)
- Test: `src/stores/livestore/hooks/useMedia.noop.spec.ts` (NEW)

**Step 1: Failing test**

```ts
// src/stores/livestore/hooks/useMedia.noop.spec.ts
import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const useQuery = vi.fn(() => [])
vi.mock('../store', () => ({ useAppStore: () => ({ useQuery }) }))
vi.mock('./useFavorites', () => ({ useFavoriteIds: () => new Set<string>() }))

import { useSearchMediaIds, useMediaMapForIds, useSearchMedia } from './useMedia'

describe('useMedia idle subscriptions', () => {
  it('useSearchMediaIds("") does NOT call store.useQuery', () => {
    useQuery.mockClear()
    const { result } = renderHook(() => useSearchMediaIds(''))
    expect(result.current).toEqual([])
    expect(useQuery).not.toHaveBeenCalled()
  })

  it('useMediaMapForIds([]) does NOT call store.useQuery', () => {
    useQuery.mockClear()
    const { result } = renderHook(() => useMediaMapForIds([]))
    expect(result.current).toEqual({})
    expect(useQuery).not.toHaveBeenCalled()
  })

  it('useSearchMedia("") does NOT call store.useQuery', () => {
    useQuery.mockClear()
    const { result } = renderHook(() => useSearchMedia(''))
    expect(result.current).toEqual([])
    expect(useQuery).not.toHaveBeenCalled()
  })
})
```

**Step 2: Run to verify it fails**

```bash
npm test -- --run src/stores/livestore/hooks/useMedia.noop.spec.ts
```
Expected: FAIL — current hooks call `useQuery(NOOP_QUERY)` unconditionally.

**Step 3: Implementation**

In `src/stores/livestore/hooks/useMedia.ts`:

1. Delete the `NOOP_QUERY` constant.
2. At top of file: `const EMPTY_IDS: readonly string[] = Object.freeze([])` and `const EMPTY_MAP: Readonly<Record<string, TransformedMedia>> = Object.freeze({})`.
3. In `useSearchMediaIds`: before any `store.useQuery` call:
   ```ts
   const term = (searchTerm ?? '').trim()
   if (!term) return EMPTY_IDS as string[]
   ```
   Move the `useMemo` for `titleQuery`/`artistQuery` after the early return. (React hooks ordering — verify all hook calls happen unconditionally by hoisting the early-return path into a separate inner hook if necessary. See Step 3a.)

**Step 3a (hook-ordering safe variant):** Refactor each hook so the early return path uses a constant set of hooks. Cleanest approach — split into two functions:

```ts
const EMPTY_IDS: readonly string[] = Object.freeze([])

export const useSearchMediaIds = (searchTerm: string | undefined | null, limit = 100) => {
  const term = (searchTerm ?? '').trim()
  return term ? useSearchMediaIdsInner(term, limit) : (EMPTY_IDS as string[])
}

const useSearchMediaIdsInner = (term: string, limit: number) => {
  const store = useAppStore()
  // … existing body, but without the `hasSearch` guard
}
```

Apply the same split to `useSearchMedia` and `useMediaMapForIds`.

> **Why split:** React's Rules of Hooks forbid conditional hook calls. The wrapper does no hook work in the empty path, then either returns the constant or calls the inner hook (which always calls the same hooks in the same order).

**Step 4: Run to verify both unit and existing tests pass**

```bash
npm test -- --run src/stores/livestore/hooks
```
Expected: PASS — new spec green, existing `useRecommendations.spec.ts` / `queueUtils.spec.ts` unchanged.

**Step 5: Commit**

```bash
git add src/stores/livestore/hooks/useMedia.ts src/stores/livestore/hooks/useMedia.noop.spec.ts
git commit -m "perf(useMedia): drop NOOP_QUERY; early-return on empty input"
```

---

### Task 6: Saga — switch to streaming generator + cursor-regression guard

**Files:**
- Modify: `src/sagas/collection/index.ts` (full rewrite of `syncMediaLibrary` + remove `progressiveHydration`)
- Test: `src/sagas/collection/index.spec.ts` (NEW)

**Step 1: Failing test**

```ts
// src/sagas/collection/index.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { runSaga, stdChannel } from 'redux-saga'
import * as types from '../../constants/ActionTypes'
import { syncMediaLibrary } from './index'

const makePage = (n: number, nextCursor: string | null, hasMore: boolean) => ({
  media: Array.from({ length: n }, (_, i) => ({
    media: { id: `m${nextCursor}-${i}` }, artist: { id: 'a' }, album: { id: 'al' },
  })),
  nextCursor, hasMore,
})

const fakeLiveStore = () => ({
  query: vi.fn(async () => [{ values: [] as unknown[][] }]),
  commit: vi.fn(async () => undefined),
  manualRefresh: vi.fn(),
})

vi.mock('../../App', () => ({ getLiveStoreInstance: () => fakeLiveStore() }))

describe('syncMediaLibrary', () => {
  it('stops at MAX_PAGES_PER_SESSION and persists cursor', async () => {
    let yielded = 0
    const provider = {
      providerKey: 'p',
      getScanStatus: async () => ({ scanning: false, count: 999, lastScan: '2026-05-01' }),
      streamAlbumsSince: async function* () {
        while (true) {
          yielded++
          yield makePage(10, String(yielded * 50), true)
        }
      },
    }
    // Inject provider — see Step 3 for the seam.
    // @ts-expect-error test seam
    syncMediaLibrary.__setProviders([provider])

    await runSaga({ channel: stdChannel(), dispatch: () => {} }, syncMediaLibrary).toPromise()
    expect(yielded).toBeLessThanOrEqual(10) // MAX_PAGES_PER_SESSION
  })

  it('resets cursor when server lastScan goes backwards', async () => {
    // …assert that after reading syncState with lastSyncTimestamp '2026-05-01',
    // a provider reporting lastScan '2026-04-01' causes since=null to be passed
    // to streamAlbumsSince.
  })
})
```

> The first test runs end-to-end against a tiny provider; the second is a "todo" placeholder unless we add a getter seam. If injecting providers via a test seam feels too invasive, switch this task to an integration-style test that mocks `getSettingsFromLiveStore` and `ProvidersService` and asserts on the page-count visible to a spied `batchedMediaCommitter.add`.

**Step 2: Run to verify it fails**

```bash
npm test -- --run src/sagas/collection/index.spec.ts
```
Expected: FAIL — `__setProviders` doesn't exist; saga still calls `getNewestAlbumsSince`.

**Step 3: Implementation**

Rewrite `src/sagas/collection/index.ts`. Key changes:

- Delete `progressiveHydration` and the dual first-sync/delta branches.
- Replace with a single loop:

```ts
const MAX_PAGES_PER_SESSION = 10

export function* syncMediaLibrary(): Generator<any, void, any> {
  const liveStore = getLiveStoreInstance()
  if (!liveStore) return

  const settings = yield call(getSettingsFromLiveStore)
  if (!settings?.providers) return

  const providersService = new ProvidersService(settings)
  const providers = Object.values(providersService.providers).filter(
    (p) => p.getScanStatus && p.streamAlbumsSince,
  )
  if (providers.length === 0) return

  const syncState: SyncState | null = yield call(readSyncState, liveStore)
  batchedMediaCommitter.setStore(liveStore)

  for (const provider of providers) {
    try {
      const scanStatus = yield call([provider, provider.getScanStatus!])
      if (scanStatus.scanning) continue

      // Cursor-regression guard: if server's lastScan is older than ours,
      // OR the count dropped, restart from scratch.
      const regressed =
        syncState &&
        (new Date(scanStatus.lastScan) < new Date(syncState.lastSyncTimestamp) ||
          scanStatus.count < syncState.lastKnownCount)
      const since = regressed ? null : (syncState?.lastSyncTimestamp ?? null)
      const cursor = regressed ? null : (syncState?.initialSyncCursor ?? null)

      const stream = provider.streamAlbumsSince!(since, { cursor: cursor != null ? String(cursor) : null })
      let pages = 0
      let lastCursor: string | null = cursor != null ? String(cursor) : null
      let complete = false

      for (;;) {
        const next = yield call(() => stream.next())
        if (next.done) { complete = true; break }
        const page = next.value as AlbumPage

        if (page.media.length > 0) {
          yield call([batchedMediaCommitter, 'add'], page.media)
          yield call([batchedMediaCommitter, 'flush'])
        }
        lastCursor = page.nextCursor
        complete = !page.hasMore
        pages++

        yield call(updateSyncState, liveStore, {
          lastSyncTimestamp: scanStatus.lastScan,
          lastKnownCount: scanStatus.count,
          initialSyncCursor: Number(lastCursor) || 0,
          initialSyncComplete: complete,
        })

        if (complete || pages >= MAX_PAGES_PER_SESSION) break
      }

      // Cancel the generator if we bailed early so the provider can clean up.
      if (!complete) await stream.return?.()
    } catch (error) {
      console.error('[Sync] Provider sync failed:', error)
    }
  }
}
```

Update `SyncState` type if `initialSyncCursor` needs to be `string | null` instead of `number`; pick one and stay consistent through `readSyncState`/`updateSyncState`. (Recommended: keep `number` for migration compat; the saga coerces.)

**Step 4: Run to verify it passes**

```bash
npm test -- --run src/sagas/collection
npx tsc --noEmit
```
Expected: PASS on both. `tsc` no longer complains about removed provider methods.

**Step 5: Commit**

```bash
git add src/sagas/collection/index.ts src/sagas/collection/index.spec.ts
git commit -m "fix(sync-saga): stream pages; bound pages/session; cursor-regression guard"
```

---

### Task 7: Cleanup dead code and stale tests

**Files:**
- Delete: `src/providers/SubsonicApiProvider.getNewestAlbumsSince.spec.ts`
- Audit: any other test that mocks `getNewestAlbumsSince` / `getAlbumsBatch`

**Step 1: Identify**

```bash
git grep -nE "getNewestAlbumsSince|getAlbumsBatch|progressiveHydration|NOOP_QUERY" -- src
```
Expected: no matches in `src/` after Tasks 4 + 6. If any remain (e.g. in `JellyfinProvider`, `MstreamApiProvider` — neither implements these today per `grep`), leave them alone.

**Step 2: Delete the stale spec**

```bash
git rm src/providers/SubsonicApiProvider.getNewestAlbumsSince.spec.ts
```

**Step 3: Run full test + lint**

```bash
npm test -- --run
npm run lint
```
Expected: all green, zero warnings.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove obsolete getNewestAlbumsSince spec"
```

---

### Task 8: Manual PWA verification

No code changes; this is the smoke test the design doc names as the success criterion.

**Step 1: Build + serve**

```bash
npm run build
npx vite preview --host 127.0.0.1 --port 4173
```

**Step 2: Install PWA**

In Chromium, open `http://127.0.0.1:4173`, install as PWA, launch the installed window.

**Step 3: Heap snapshots**

DevTools → Memory → Heap snapshot at:
- t=0 (load complete, before sync)
- t=10s (mid-sync)
- t=30s (sync should be complete or paused at `MAX_PAGES_PER_SESSION`)

**Acceptance:** All three snapshots under 200 MB JS heap. No `V8 javascript OOM` lines in `chrome://crashes` or stderr. No `SIGILL` error page.

**Step 4: Note results**

Append a short verification note to the design doc:

```bash
echo "" >> docs/plans/2026-05-26-pwa-install-oom-design.md
echo "## Verification ($(date -u +%Y-%m-%dT%H:%MZ))" >> docs/plans/2026-05-26-pwa-install-oom-design.md
echo "- Heap snapshots @ t=0/10s/30s: <fill in MB>" >> docs/plans/2026-05-26-pwa-install-oom-design.md
echo "- PWA install + first sync: no crash" >> docs/plans/2026-05-26-pwa-install-oom-design.md
git add docs/plans/2026-05-26-pwa-install-oom-design.md
git commit -m "docs: verify PWA install OOM fix"
```

---

## Done definition

- `npm test -- --run` green.
- `npm run lint` zero warnings.
- `npx tsc --noEmit` clean.
- PWA install on Chromium against the user's actual server completes first sync without renderer OOM; heap stays under 200 MB.
- All commits land on `master` in the order listed.
