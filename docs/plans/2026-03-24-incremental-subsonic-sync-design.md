# Incremental Subsonic Sync Design

**Date:** 2026-03-24
**Problem:** Every app launch makes ~51 HTTP requests to Subsonic and upserts hundreds of already-known songs, even when nothing changed on the server.

## Core Mechanism: `getScanStatus` as Gatekeeper

Every sync decision starts with a single cheap call to `getScanStatus`, which returns `lastScan` timestamp and `count`. We store `lastSyncTimestamp` and `lastKnownCount` in LiveStore. Compare:

- **Nothing changed** (`lastScan` unchanged AND `count` unchanged) → skip entirely (0 additional requests)
- **New scan detected** → fetch `getAlbumList2?type=newest` and stop when we hit an album with `created` ≤ our `lastSyncTimestamp` — only fetching truly new albums
- **Count decreased** (deletions) → handle separately, lower priority

## Sync Phases

### Phase 1 — App Init (fast path)

1. Call `getScanStatus` (1 request)
2. If nothing changed → done, show LiveStore data
3. If new scan → fetch newest albums until we hit already-synced ones, fetch their songs, commit to LiveStore
4. Update `lastSyncTimestamp` and `lastKnownCount`

### Phase 2 — First Launch / Initial Hydration

1. Fetch newest 500 albums + their songs (batched, background, non-blocking)
2. Store a `syncCursor` (offset) so it's **resumable** across sessions
3. Progressively expand on subsequent launches if user wants more
4. Albums fetched in batches of 50, songs fetched in parallel batches of 10 per album batch

### Phase 3 — Periodic Poll (every 5 minutes while app is open)

1. Same logic as Phase 1 — `getScanStatus` → delta fetch if needed
2. Lightweight: usually 1 request, occasionally a few more

## Data Model Changes

New `syncState` table in LiveStore:

```
syncState {
  id: 'default'
  lastSyncTimestamp: string (ISO date from getScanStatus.lastScan)
  lastKnownCount: number
  initialSyncCursor: number (offset for resumable first-launch hydration)
  initialSyncComplete: boolean
}
```

New events: `SyncStateUpdated`

## Provider Changes

### SubsonicApiProvider — new methods

- `getScanStatus()` → returns `{ scanning: boolean, count: number, lastScan: string }`
- `getNewestAlbumsSince(sinceDate: string)` → fetches `getAlbumList2?type=newest` page by page, stops when `created ≤ sinceDate`, returns albums + songs
- `getAlbumsBatch(offset: number, size: number)` → for initial hydration, fetches a batch of albums + their songs

### SubsonicApiProvider — removed methods

- `fullSync()` → replaced by progressive hydration
- `getRecentMedia()` → replaced by `getNewestAlbumsSince()`

### IMusicProvider — interface changes

- Remove `fullSync?()` and `getRecentMedia?()`
- Add `getScanStatus?()` and `getNewestAlbumsSince?(sinceDate: string)`
- Add `getAlbumsBatch?(offset: number, size: number)`

## Saga Changes

### Replace `fetchRecentAlbums` with `syncMediaLibrary`

```
syncMediaLibrary:
  1. Read syncState from LiveStore
  2. Call provider.getScanStatus()
  3. If lastScan === syncState.lastSyncTimestamp AND count === syncState.lastKnownCount:
     → return (nothing to do)
  4. If syncState.lastSyncTimestamp exists:
     → call provider.getNewestAlbumsSince(syncState.lastSyncTimestamp)
     → commit new media to LiveStore
  5. If !syncState.initialSyncComplete:
     → start/resume background hydration from syncState.initialSyncCursor
     → fetch in batches, update cursor after each batch
  6. Update syncState
```

### New saga: `periodicSyncPoll`

- Runs every 5 minutes via `delay()` + loop
- Calls same `syncMediaLibrary` logic
- Lightweight: usually 1 HTTP request

## Performance Comparison

| Scenario | Current | Proposed |
|---|---|---|
| App init (nothing changed) | ~51 HTTP requests + full upsert | 1 request, done |
| App init (5 new albums) | ~51 requests, upserts everything | ~6 requests, inserts only new |
| First launch | 50 albums only | 500 albums progressively |
| Mid-session detection | None | Poll every 5 min |
| Offline browsing | Only 50 recent albums | Growing local cache |

## What Stays the Same

- `getArtistSongs()` on-demand for browsing artists not yet synced
- `search()` hits Subsonic server-side
- `mapSongs()` mapping logic
- LiveStore schema for media/artists/albums (no changes)
- `batchedMediaCommitter` for inserting new media

## Edge Cases

- **Server scanning in progress** (`scanning: true`): skip sync, retry next poll
- **First launch with no connectivity**: show empty state, sync when online
- **Resumable hydration**: if app closes mid-hydration, cursor is persisted, resumes next launch
- **Album deletions** (count decreased): lower priority, track separately if needed
