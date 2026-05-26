# PWA Install OOM — Design

**Date:** 2026-05-26
**Scope:** Stop the renderer OOM that crashes Chromium PWA installs of deplayer,
and the reactive-invalidation storm that compounds it during first sync.
**Non-goals:** `SpectrumVisualizer` per-frame allocations; multi-provider parallel
sync; replacing the saga-driven sync with LiveStore's own sync layer.

## Problem

On PWA install, the renderer hits V8's ~4 GB ceiling ~25 s after first paint:

```
V8 javascript OOM (MarkCompactCollector: young object promotion failed)
… 3812.5 -> 3810.6 MB …
```

The `SIGILL` shown on the PWA error page is V8's abort trap firing immediately
after the OOM — a consequence, not a separate fault.

The 25 s timing maps to `deferredSync` (5 s wait + `syncMediaLibrary`). Three
defects compound under a cold renderer:

1. **Unbounded delta accumulation.** `SubsonicApiProvider.getNewestAlbumsSince`
   walks every album newer than the stored timestamp, fetches the song list for
   each (10 in parallel, no yield), and accumulates every `NormalizedMedia` in
   one in-memory `allSongs` array before returning to the saga. For libraries of
   tens of thousands of tracks this is hundreds of MB to several GB.
2. **Buffer duplication and oversized SQL existence check.**
   `BatchedMediaCommitter.flush()` does `[...this.pendingMedia]` (copies the
   whole buffer) and then `SELECT id FROM media WHERE id IN (?,?,…)` with one
   placeholder per pending item. `add()` also `push(...mediaItems)`s the raw
   input, so `MAX_BATCH_SIZE = 500` only triggers *after* an arbitrarily large
   push.
3. **NOOP query invalidation storm.** `useMedia.NOOP_QUERY` subscribes to
   `sync_state` "because it mutates rarely" — but hydration calls
   `updateSyncState` every 50 items, invalidating every idle subscriber
   (`useSearchMediaIds`, `useMediaMapForIds`, …) and allocating fresh result
   arrays per cycle.

## Approach

Three boundaries change; everything else stays.

### Provider layer

Replace `getNewestAlbumsSince(since): Promise<NormalizedMedia[]>` and the
overlapping `getAlbumsBatch(offset, size)` with one streaming method:

```ts
streamAlbumsSince(
  since: string | null,
  opts?: { pageSize?: number },
): AsyncGenerator<{ media: NormalizedMedia[]; nextCursor: string | null; hasMore: boolean }>
```

`since = null` is the first-ever sync (yield from the newest end until done or
the saga stops pulling). `since = <timestamp>` is the delta path (stop at the
boundary). The generator never holds more than one page of `NormalizedMedia`
objects in memory.

### Saga

`syncMediaLibrary` becomes one `for await` loop over the generator. Per page:

1. `batchedMediaCommitter.add(page.media)`
2. `batchedMediaCommitter.flush()`
3. `updateSyncState({ initialSyncCursor: page.nextCursor, initialSyncComplete: !page.hasMore })`

One per-session cap — `MAX_PAGES_PER_SESSION` (default 10, ≈500 songs) — replaces
both `MAX_BATCHES_PER_SESSION` and the unbounded delta loop. `progressiveHydration`
disappears; it is the same loop now.

Cursor-regression guard: if `scanStatus.lastScan < syncState.lastSyncTimestamp`
(server rescan), reset cursor to `null` and re-enter the first-sync branch.

### BatchedMediaCommitter

- `add(items)`: while `items.length > MAX_BATCH_SIZE`, slice the first chunk,
  push, await `flush()`. Then push the remainder. Bound is enforced before the
  buffer can balloon.
- `flush()`: swap, don't spread:
  `const mediaToCommit = this.pendingMedia; this.pendingMedia = []`.
- Existence check chunks the `IN (…)` query to ≤500 placeholders per round-trip;
  the merged `Set<string>` is the only cross-chunk state.
- `manualRefresh` is called once per `flush()` call (i.e. per page), not per
  internal chunk — same as today, just explicit.

### Reactive hygiene

Delete `NOOP_QUERY`. The hooks that used it early-return before calling
`store.useQuery`:

```ts
export const useSearchMediaIds = (term, limit = 100) => {
  if (!term?.trim()) return EMPTY_IDS // module-level frozen []
  // … existing logic
}
```

Same treatment for `useMediaMapForIds([])` and `useSearchMedia('')`. No phantom
subscription means no invalidation when `sync_state` writes during hydration.

## Data flow

```
Saga ──▶ provider.streamAlbumsSince(since)
         │
         │ yields { media: NormalizedMedia[≤pageSize], nextCursor, hasMore }
         ▼
       BatchedMediaCommitter.add(page.media)   // bounded
       BatchedMediaCommitter.flush()           // chunked existence + commits
         │
         ▼
       store.manualRefresh()                   // once per page
       updateSyncState({ cursor, complete })
         │
         ▼
       loop until !hasMore OR pages == MAX_PAGES_PER_SESSION
```

Peak renderer-heap residency per cycle: one page (≈150 KB at 50 songs) plus the
placeholders for one chunked existence check (≈50 KB at 500 ids). Independent of
library size.

## Error handling

- **Provider throws mid-stream.** Saga `try`/`catch` around the `for await`
  iteration; log, break the provider's loop, leave the cursor untouched. Next
  sync cycle resumes from saved cursor.
- **`flush()` throws.** Re-queue `mediaToCommit` into `pendingMedia` (current
  behaviour) and emit `SAVE_COLLECTION_FAILED`. Add a per-flush retry budget
  (3 attempts) so a poisoned page can't loop forever.
- **Cursor regression** (server rescan): detect via `lastScan` ordering, reset
  cursor + `initialSyncComplete = false`.

## Testing

| Layer | Test | Asserts |
| ----- | ---- | ------- |
| Unit | `BatchedMediaCommitter.add(items.length = 5000)` | flushes complete; `pendingMedia` never exceeds `MAX_BATCH_SIZE`; no `[...pendingMedia]` copy in flush path (verify via spy) |
| Unit | `BatchedMediaCommitter.flush` with 1200 ids | existence query is issued in 3 calls, none with >500 placeholders |
| Unit | `SubsonicApiProvider.streamAlbumsSince` | yields page-sized chunks; respects `since` boundary; intermediate `expect(gen.next())` between mocked axios pages proves no full-array buffer |
| Unit | `useSearchMediaIds('')` / `useMediaMapForIds([])` / `useSearchMedia('')` | `store.useQuery` not called (mock + call-count assertion) |
| Integration | `syncMediaLibrary` with 12-page mock provider, `MAX_PAGES_PER_SESSION = 10` | commits 10 pages; persists cursor at page 10; exits without throwing |
| Manual | Install PWA, take heap snapshots at t=0/10s/30s | renderer heap stable under ~200 MB through first sync |

## File map

- `src/providers/IMusicProvider.ts` — interface: drop `getAlbumsBatch` + `getNewestAlbumsSince`, add `streamAlbumsSince`.
- `src/providers/SubsonicApiProvider.ts` — implement `streamAlbumsSince`; delete the two replaced methods.
- `src/providers/SubsonicApiProvider.spec.ts` + `*.getNewestAlbumsSince.spec.ts` — rewrite around generator.
- `src/sagas/collection/index.ts` — collapse `progressiveHydration` + `syncMediaLibrary` into one loop; add cursor-regression guard.
- `src/stores/livestore/services/BatchedMediaCommitter.ts` — bounded `add`, swap-don't-spread, chunked existence query, flush-retry budget.
- `src/stores/livestore/services/BatchedMediaCommitter.spec.ts` *(new)*.
- `src/stores/livestore/hooks/useMedia.ts` — delete `NOOP_QUERY`, early-return in `useSearchMedia`, `useSearchMediaIds`, `useMediaMapForIds`.

## Risks

- Other providers (`JellyfinProvider`, `MstreamApiProvider`) implement
  `getAlbumsBatch`/`getNewestAlbumsSince` shapes. Migration: keep them returning
  arrays for one release behind a thin `arrayToStream` adapter at the provider
  edge, migrate in a follow-up.
- LiveStore's `manualRefresh` semantics around chunked `skipRefresh` commits are
  load-bearing — verify behaviour is unchanged when `add()` now slices.
- Heap-snapshot expectation depends on library size; instrument the saga with
  one `profiler.mark` per page so we can verify in production.
