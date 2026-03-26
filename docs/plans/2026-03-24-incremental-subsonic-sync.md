# Incremental Subsonic Sync — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the brute-force "fetch 50 newest albums every launch" with incremental sync that skips work when nothing changed on Navidrome, and only fetches truly new albums when something did.

**Architecture:** Add a `syncState` table to LiveStore to track last sync timestamp. On init, call `getScanStatus` (1 request) to check if Navidrome has new data. If unchanged, skip entirely. If changed, fetch only albums added since last sync. Background periodic poll every 5 minutes. Progressive initial hydration (500 albums, resumable).

**Tech Stack:** LiveStore (events + materializers), Redux Saga (orchestration), Subsonic/OpenSubsonic API, Vitest (tests)

---

### Task 1: Add `syncState` LiveStore table + events

**Files:**
- Create: `src/stores/livestore/events/sync.ts`
- Modify: `src/stores/livestore/schema.ts`

**Step 1: Create sync events file**

Create `src/stores/livestore/events/sync.ts`:

```typescript
import { Events, Schema } from '@livestore/livestore'

export const syncEvents = {
  syncStateUpdated: Events.synced({
    name: 'v1.SyncStateUpdated',
    schema: Schema.Struct({
      id: Schema.String, // 'default'
      lastSyncTimestamp: Schema.String, // ISO date from getScanStatus.lastScan
      lastKnownCount: Schema.Number,
      initialSyncCursor: Schema.Number, // offset for resumable hydration
      initialSyncComplete: Schema.Boolean,
    }),
  }),
}
```

**Step 2: Add syncState table and materializer to schema.ts**

In `src/stores/livestore/schema.ts`:

Add to imports:
```typescript
import { syncEvents } from './events/sync'
```

Add to `tables`:
```typescript
  syncState: State.SQLite.table({
    name: 'sync_state',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      lastSyncTimestamp: State.SQLite.text({ default: '' }),
      lastKnownCount: State.SQLite.integer({ default: 0 }),
      initialSyncCursor: State.SQLite.integer({ default: 0 }),
      initialSyncComplete: State.SQLite.boolean({ default: false }),
      updatedAt: State.SQLite.integer({}),
    },
  }),
```

Add to `events`:
```typescript
  ...syncEvents,
```

Add materializer:
```typescript
  'v1.SyncStateUpdated': ({ id, lastSyncTimestamp, lastKnownCount, initialSyncCursor, initialSyncComplete }: any) => {
    const now = Date.now()
    return tables.syncState
      .insert({
        id,
        lastSyncTimestamp,
        lastKnownCount,
        initialSyncCursor,
        initialSyncComplete,
        updatedAt: now,
      })
      .onConflict('id', 'update', {
        lastSyncTimestamp,
        lastKnownCount,
        initialSyncCursor,
        initialSyncComplete,
        updatedAt: now,
      })
  },
```

**Step 3: Run `npm run db:generate` and verify build**

```bash
npm run db:generate
npm run build
```

**Step 4: Commit**

```bash
jj describe -m "feat: add syncState table and events to LiveStore"
jj new
```

---

### Task 2: Add `getScanStatus` to SubsonicApiProvider

**Files:**
- Modify: `src/providers/SubsonicApiProvider.ts`
- Modify: `src/providers/IMusicProvider.ts`
- Create: `src/providers/SubsonicApiProvider.getScanStatus.spec.ts`

**Step 1: Write the failing test**

Create `src/providers/SubsonicApiProvider.getScanStatus.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SubsonicApiProvider from './SubsonicApiProvider'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios)

describe('SubsonicApiProvider.getScanStatus', () => {
  let provider: SubsonicApiProvider

  beforeEach(() => {
    vi.clearAllMocks()
    provider = new SubsonicApiProvider(
      { baseUrl: 'http://localhost', user: 'test', password: 'test' },
      'subsonic-1'
    )
  })

  it('should return scan status from server', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        'subsonic-response': {
          scanStatus: {
            scanning: false,
            count: 73014,
            lastScan: '2026-03-19T04:27:49.356885532Z',
          },
        },
      },
    })

    const result = await provider.getScanStatus()

    expect(result).toEqual({
      scanning: false,
      count: 73014,
      lastScan: '2026-03-19T04:27:49.356885532Z',
    })
    expect(mockedAxios.get).toHaveBeenCalledTimes(1)
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/rest/getScanStatus.view')
    )
  })

  it('should handle scanning in progress', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        'subsonic-response': {
          scanStatus: {
            scanning: true,
            count: 73014,
            lastScan: '2026-03-19T04:27:49.356885532Z',
          },
        },
      },
    })

    const result = await provider.getScanStatus()
    expect(result.scanning).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/providers/SubsonicApiProvider.getScanStatus.spec.ts
```

Expected: FAIL — `getScanStatus` not defined

**Step 3: Add interface and implementation**

In `src/providers/IMusicProvider.ts`, add:
```typescript
export interface ScanStatus {
  scanning: boolean
  count: number
  lastScan: string
}
```

Add to `IMusicProvider`:
```typescript
  getScanStatus?(): Promise<ScanStatus>;
```

In `src/providers/SubsonicApiProvider.ts`, add method:
```typescript
  async getScanStatus(): Promise<{ scanning: boolean; count: number; lastScan: string }> {
    const result = await axios.get(
      `${this.baseUrl}/rest/getScanStatus.view?u=${this.user}&p=${this.password}&c=deplayer&v=1.16.1&f=json`
    )
    const status = result.data['subsonic-response'].scanStatus
    return {
      scanning: status.scanning,
      count: status.count,
      lastScan: status.lastScan,
    }
  }
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/providers/SubsonicApiProvider.getScanStatus.spec.ts
```

**Step 5: Commit**

```bash
jj describe -m "feat: add getScanStatus to SubsonicApiProvider"
jj new
```

---

### Task 3: Add `getNewestAlbumsSince` to SubsonicApiProvider

**Files:**
- Modify: `src/providers/SubsonicApiProvider.ts`
- Modify: `src/providers/IMusicProvider.ts`
- Create: `src/providers/SubsonicApiProvider.getNewestAlbumsSince.spec.ts`

**Step 1: Write the failing test**

Create `src/providers/SubsonicApiProvider.getNewestAlbumsSince.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SubsonicApiProvider from './SubsonicApiProvider'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios)

const makeAlbumListResponse = (albums: any[]) => ({
  data: {
    'subsonic-response': {
      albumList2: { album: albums },
    },
  },
})

const makeAlbumDetailResponse = (album: any, songs: any[]) => ({
  data: {
    'subsonic-response': {
      album: { ...album, song: songs },
    },
  },
})

describe('SubsonicApiProvider.getNewestAlbumsSince', () => {
  let provider: SubsonicApiProvider

  beforeEach(() => {
    vi.clearAllMocks()
    provider = new SubsonicApiProvider(
      { baseUrl: 'http://localhost', user: 'test', password: 'test' },
      'subsonic-1'
    )
  })

  it('should fetch only albums newer than sinceDate', async () => {
    // Page 1: 2 new albums + 1 old album (stops here)
    mockedAxios.get
      .mockResolvedValueOnce(
        makeAlbumListResponse([
          { id: 'a1', name: 'New Album 1', created: '2026-03-18T00:00:00Z', songCount: 1 },
          { id: 'a2', name: 'New Album 2', created: '2026-03-17T00:00:00Z', songCount: 1 },
          { id: 'a3', name: 'Old Album', created: '2026-03-10T00:00:00Z', songCount: 1 },
        ])
      )
      // Album detail for a1
      .mockResolvedValueOnce(
        makeAlbumDetailResponse(
          { id: 'a1', year: 2026 },
          [{ id: 's1', title: 'Song 1', artist: 'Artist', album: 'New Album 1', duration: 200, track: 1 }]
        )
      )
      // Album detail for a2
      .mockResolvedValueOnce(
        makeAlbumDetailResponse(
          { id: 'a2', year: 2026 },
          [{ id: 's2', title: 'Song 2', artist: 'Artist', album: 'New Album 2', duration: 180, track: 1 }]
        )
      )

    const result = await provider.getNewestAlbumsSince('2026-03-15T00:00:00Z')

    // Should only return songs from 2 new albums, not the old one
    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Song 1')
    expect(result[1].title).toBe('Song 2')
    // Should NOT have fetched album detail for a3
    expect(mockedAxios.get).toHaveBeenCalledTimes(3) // 1 list + 2 details
  })

  it('should return empty array when no new albums', async () => {
    mockedAxios.get.mockResolvedValueOnce(
      makeAlbumListResponse([
        { id: 'a1', name: 'Old Album', created: '2026-03-10T00:00:00Z', songCount: 1 },
      ])
    )

    const result = await provider.getNewestAlbumsSince('2026-03-15T00:00:00Z')
    expect(result).toHaveLength(0)
    expect(mockedAxios.get).toHaveBeenCalledTimes(1) // only the list call
  })

  it('should paginate when all albums on first page are new', async () => {
    // Page 1: all new (size=50 but we simulate 2)
    mockedAxios.get
      .mockResolvedValueOnce(
        makeAlbumListResponse([
          { id: 'a1', name: 'Album 1', created: '2026-03-18T00:00:00Z', songCount: 1 },
          { id: 'a2', name: 'Album 2', created: '2026-03-17T00:00:00Z', songCount: 1 },
        ])
      )
      // Page 2: has old album (stops)
      .mockResolvedValueOnce(
        makeAlbumListResponse([
          { id: 'a3', name: 'Old Album', created: '2026-03-10T00:00:00Z', songCount: 1 },
        ])
      )
      // Album details
      .mockResolvedValueOnce(makeAlbumDetailResponse({ id: 'a1' }, [{ id: 's1', title: 'S1', artist: 'A', album: 'Album 1', duration: 100, track: 1 }]))
      .mockResolvedValueOnce(makeAlbumDetailResponse({ id: 'a2' }, [{ id: 's2', title: 'S2', artist: 'A', album: 'Album 2', duration: 100, track: 1 }]))

    const result = await provider.getNewestAlbumsSince('2026-03-15T00:00:00Z')
    expect(result).toHaveLength(2)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/providers/SubsonicApiProvider.getNewestAlbumsSince.spec.ts
```

**Step 3: Implement `getNewestAlbumsSince`**

In `src/providers/IMusicProvider.ts`, add:
```typescript
  getNewestAlbumsSince?(sinceDate: string): Promise<IMedia[]>;
```

In `src/providers/SubsonicApiProvider.ts`, add:
```typescript
  async getNewestAlbumsSince(sinceDate: string): Promise<IMedia[]> {
    const PAGE_SIZE = 50
    const BATCH_SIZE = 10
    const allSongs: IMedia[] = []
    let offset = 0
    let done = false

    while (!done) {
      const result = await axios.get(
        `${this.baseUrl}/rest/getAlbumList2.view?u=${this.user}&p=${this.password}&c=deplayer&v=1.16.1&f=json&type=newest&size=${PAGE_SIZE}&offset=${offset}`
      )
      const albums = result.data['subsonic-response'].albumList2?.album || []

      if (albums.length === 0) {
        done = true
        break
      }

      // Filter to only albums created after sinceDate
      const newAlbums = []
      for (const album of albums) {
        if (new Date(album.created) > new Date(sinceDate)) {
          newAlbums.push(album)
        } else {
          // Albums are sorted newest-first, so we can stop
          done = true
          break
        }
      }

      // Fetch songs for new albums in parallel batches
      for (let i = 0; i < newAlbums.length; i += BATCH_SIZE) {
        const batch = newAlbums.slice(i, i + BATCH_SIZE)
        const batchResults = await Promise.allSettled(
          batch.map(async (album: any) => {
            const albumDetails = await axios.get(
              `${this.baseUrl}/rest/getAlbum.view?u=${this.user}&p=${this.password}&c=deplayer&v=1.16.1&f=json&id=${album.id}`
            )
            const songs = albumDetails.data['subsonic-response'].album?.song || []
            return { songs, album }
          })
        )

        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            allSongs.push(...this.mapSongs(result.value.songs, [result.value.album]))
          } else {
            logger.error('Error fetching album songs:', result.reason)
          }
        }
      }

      // If we didn't hit an old album, paginate
      if (!done) {
        offset += PAGE_SIZE
      }
    }

    return allSongs
  }
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/providers/SubsonicApiProvider.getNewestAlbumsSince.spec.ts
```

**Step 5: Commit**

```bash
jj describe -m "feat: add getNewestAlbumsSince to SubsonicApiProvider"
jj new
```

---

### Task 4: Add `getAlbumsBatch` for progressive hydration

**Files:**
- Modify: `src/providers/SubsonicApiProvider.ts`
- Modify: `src/providers/IMusicProvider.ts`

**Step 1: Add interface**

In `src/providers/IMusicProvider.ts`:
```typescript
  getAlbumsBatch?(offset: number, size: number): Promise<{ media: IMedia[]; hasMore: boolean }>;
```

**Step 2: Implement**

In `src/providers/SubsonicApiProvider.ts`:
```typescript
  async getAlbumsBatch(offset: number, size: number): Promise<{ media: IMedia[]; hasMore: boolean }> {
    const BATCH_SIZE = 10
    const result = await axios.get(
      `${this.baseUrl}/rest/getAlbumList2.view?u=${this.user}&p=${this.password}&c=deplayer&v=1.16.1&f=json&type=newest&size=${size}&offset=${offset}`
    )
    const albums = result.data['subsonic-response'].albumList2?.album || []
    const allSongs: IMedia[] = []

    for (let i = 0; i < albums.length; i += BATCH_SIZE) {
      const batch = albums.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.allSettled(
        batch.map(async (album: any) => {
          const albumDetails = await axios.get(
            `${this.baseUrl}/rest/getAlbum.view?u=${this.user}&p=${this.password}&c=deplayer&v=1.16.1&f=json&id=${album.id}`
          )
          const songs = albumDetails.data['subsonic-response'].album?.song || []
          return { songs, album }
        })
      )
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          allSongs.push(...this.mapSongs(result.value.songs, [result.value.album]))
        }
      }
    }

    return { media: allSongs, hasMore: albums.length === size }
  }
```

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
jj describe -m "feat: add getAlbumsBatch for progressive hydration"
jj new
```

---

### Task 5: Replace `fetchRecentAlbums` saga with `syncMediaLibrary`

**Files:**
- Modify: `src/sagas/collection/index.ts`
- Modify: `src/constants/ActionTypes.ts`

**Step 1: Add new action type**

In `src/constants/ActionTypes.ts`, add:
```typescript
export const SYNC_MEDIA_LIBRARY = "SYNC_MEDIA_LIBRARY";
```

**Step 2: Replace `fetchRecentAlbums` with `syncMediaLibrary`**

Replace the entire `fetchRecentAlbums` generator in `src/sagas/collection/index.ts`:

```typescript
import { takeLatest, fork, call, put, delay } from "redux-saga/effects";
import { queryDb } from "@livestore/livestore";
// ... existing imports ...
import { syncEvents } from "../../stores/livestore/events/sync";

function* readSyncState(liveStore: any): Generator<any, any, any> {
  try {
    const result = yield call(() =>
      liveStore.query({
        query: "SELECT * FROM sync_state WHERE id = 'default'",
        bindValues: {},
      })
    );
    const rows = (result as any)?.[0]?.values || [];
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      lastSyncTimestamp: row[1],
      lastKnownCount: row[2],
      initialSyncCursor: row[3],
      initialSyncComplete: row[4] === 1,
    };
  } catch {
    return null;
  }
}

function* updateSyncState(
  liveStore: any,
  state: {
    lastSyncTimestamp: string;
    lastKnownCount: number;
    initialSyncCursor: number;
    initialSyncComplete: boolean;
  }
): Generator<any, void, any> {
  yield call(() =>
    liveStore.commit(
      syncEvents.syncStateUpdated({
        id: "default",
        ...state,
      })
    )
  );
}

export function* syncMediaLibrary(): Generator<any, void, any> {
  try {
    const liveStore = getLiveStoreInstance();
    if (!liveStore) {
      console.warn("LiveStore not available");
      return;
    }

    const settings = yield call(getSettingsFromLiveStore);
    if (!settings?.providers) return;

    const providersService = new ProvidersService(settings);
    const providers = Object.values(providersService.providers).filter(
      (p) => p.getScanStatus && p.getNewestAlbumsSince
    );

    if (providers.length === 0) {
      console.warn("No providers support incremental sync");
      return;
    }

    const syncState = yield call(readSyncState, liveStore);
    batchedMediaCommitter.setStore(liveStore);

    for (const provider of providers) {
      try {
        // Step 1: Check if anything changed
        const scanStatus: { scanning: boolean; count: number; lastScan: string } =
          yield call([provider, provider.getScanStatus!]);

        if (scanStatus.scanning) {
          console.log("[Sync] Server is scanning, skipping this cycle");
          continue;
        }

        if (
          syncState &&
          syncState.lastSyncTimestamp === scanStatus.lastScan &&
          syncState.lastKnownCount === scanStatus.count
        ) {
          console.log("[Sync] Nothing changed, skipping");

          // Still do initial hydration if incomplete
          if (!syncState.initialSyncComplete && provider.getAlbumsBatch) {
            yield call(progressiveHydration, provider, liveStore, syncState, scanStatus);
          }
          continue;
        }

        // Step 2: Fetch only new albums
        if (syncState?.lastSyncTimestamp) {
          console.log(`[Sync] Fetching albums newer than ${syncState.lastSyncTimestamp}`);
          const newMedia: IMedia[] = yield call(
            [provider, provider.getNewestAlbumsSince!],
            syncState.lastSyncTimestamp
          );

          if (newMedia.length > 0) {
            yield call([batchedMediaCommitter, "add"], newMedia);
            yield call([batchedMediaCommitter, "flush"]);
            console.log(`[Sync] Added ${newMedia.length} new songs`);
          }
        } else {
          // First sync ever — fetch recent 50 albums for immediate UI
          console.log("[Sync] First sync — fetching recent albums");
          const recentMedia: IMedia[] = yield call(
            [provider, provider.getNewestAlbumsSince!],
            "1970-01-01T00:00:00Z"
          );

          // getNewestAlbumsSince with epoch will get everything on page 1 (50 newest)
          // but we actually want a controlled first fetch — use getAlbumsBatch
          if (provider.getAlbumsBatch) {
            const batch: { media: IMedia[]; hasMore: boolean } = yield call(
              [provider, provider.getAlbumsBatch!],
              0,
              50
            );
            if (batch.media.length > 0) {
              yield call([batchedMediaCommitter, "add"], batch.media);
              yield call([batchedMediaCommitter, "flush"]);
            }
          }
        }

        // Step 3: Update sync state
        const currentCursor = syncState?.initialSyncCursor || 50;
        const isComplete = syncState?.initialSyncComplete || false;
        yield call(updateSyncState, liveStore, {
          lastSyncTimestamp: scanStatus.lastScan,
          lastKnownCount: scanStatus.count,
          initialSyncCursor: currentCursor,
          initialSyncComplete: isComplete,
        });

        // Step 4: Progressive hydration if not complete
        if (!isComplete && provider.getAlbumsBatch) {
          const updatedSyncState = yield call(readSyncState, liveStore);
          yield call(progressiveHydration, provider, liveStore, updatedSyncState, scanStatus);
        }
      } catch (error) {
        console.error("[Sync] Provider sync failed:", error);
      }
    }
  } catch (error) {
    console.error("[Sync] syncMediaLibrary failed:", error);
    yield put({ type: types.FETCH_RECENT_ALBUMS_ERROR, error });
  }
}

function* progressiveHydration(
  provider: any,
  liveStore: any,
  syncState: any,
  scanStatus: { lastScan: string; count: number }
): Generator<any, void, any> {
  const BATCH_SIZE = 50;
  const MAX_BATCHES_PER_SESSION = 10; // 500 albums max per session
  let cursor = syncState?.initialSyncCursor || 0;
  let batchesProcessed = 0;

  batchedMediaCommitter.setStore(liveStore);

  while (batchesProcessed < MAX_BATCHES_PER_SESSION) {
    const batch: { media: IMedia[]; hasMore: boolean } = yield call(
      [provider, provider.getAlbumsBatch!],
      cursor,
      BATCH_SIZE
    );

    if (batch.media.length > 0) {
      yield call([batchedMediaCommitter, "add"], batch.media);
      yield call([batchedMediaCommitter, "flush"]);
    }

    cursor += BATCH_SIZE;
    batchesProcessed++;

    if (!batch.hasMore) {
      // Hydration complete
      yield call(updateSyncState, liveStore, {
        lastSyncTimestamp: scanStatus.lastScan,
        lastKnownCount: scanStatus.count,
        initialSyncCursor: cursor,
        initialSyncComplete: true,
      });
      console.log("[Sync] Initial hydration complete");
      return;
    }

    // Save cursor progress
    yield call(updateSyncState, liveStore, {
      lastSyncTimestamp: scanStatus.lastScan,
      lastKnownCount: scanStatus.count,
      initialSyncCursor: cursor,
      initialSyncComplete: false,
    });

    // Yield to avoid blocking UI
    yield delay(100);
  }

  console.log(`[Sync] Hydration paused at cursor ${cursor}, will resume next session`);
}

function* periodicSyncPoll(): Generator<any, void, any> {
  while (true) {
    yield delay(5 * 60 * 1000); // 5 minutes
    yield call(syncMediaLibrary);
  }
}

function* collectionSaga(): any {
  yield takeLatest(types.REMOVE_FROM_COLLECTION, removeFromDbWorker);
  yield takeLatest(types.DELETE_COLLECTION, deleteCollectionWorker);
  yield takeLatest(types.EXPORT_COLLECTION, exportCollectionWorker);
  yield takeLatest(types.IMPORT_COLLECTION, importCollectionWorker);
  yield takeLatest(types.SONG_PLAYED, trackSongPlayed);
  yield takeLatest(types.INITIALIZED, syncMediaLibrary);
  yield fork(periodicSyncPoll);
  yield fork(initializeWatcher);
  yield fork(addToCollectionWatcher);
}
```

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
jj describe -m "feat: replace fetchRecentAlbums with incremental syncMediaLibrary"
jj new
```

---

### Task 6: Clean up deprecated methods

**Files:**
- Modify: `src/providers/SubsonicApiProvider.ts` — remove `fullSync()` and `getRecentMedia()`
- Modify: `src/providers/IMusicProvider.ts` — remove `fullSync?()` and `getRecentMedia?()`
- Modify: `src/providers/JellyfinProvider.ts` — update if it has `fullSync`
- Remove unused Redux actions if `FETCH_RECENT_ALBUMS_SUCCESS` is no longer dispatched

**Step 1: Remove `fullSync` and `getRecentMedia` from SubsonicApiProvider**

Delete both methods from the class.

**Step 2: Remove from IMusicProvider interface**

Remove `fullSync?()` and `getRecentMedia?()` lines.

**Step 3: Check JellyfinProvider**

If it has `fullSync`, remove it too (or leave if it has a different sync mechanism).

**Step 4: Run full test suite**

```bash
npm test
npm run lint
```

**Step 5: Commit**

```bash
jj describe -m "refactor: remove deprecated fullSync and getRecentMedia"
jj new
```

---

### Task 7: Integration test — end-to-end sync flow

**Files:**
- Create: `src/sagas/collection/syncMediaLibrary.spec.ts`

**Step 1: Write tests for the key scenarios**

```typescript
import { describe, it, expect, vi } from 'vitest'

describe('syncMediaLibrary', () => {
  it('should skip sync when getScanStatus shows nothing changed')
  it('should fetch only new albums when lastScan is newer')
  it('should do initial hydration on first launch')
  it('should resume hydration from saved cursor')
})
```

Implement each test using saga test helpers (`runSaga` or `expectSaga` from `redux-saga-test-plan`), mocking the provider and LiveStore.

**Step 2: Run tests**

```bash
npm test -- src/sagas/collection/syncMediaLibrary.spec.ts
```

**Step 3: Commit**

```bash
jj describe -m "test: add integration tests for syncMediaLibrary"
jj new
```

---

### Task 8: Final verification

**Step 1: Run full test suite**

```bash
npm test
npm run lint
npm run build
```

**Step 2: Manual smoke test**

```bash
npm run dev
```

Verify:
1. First launch: fetches albums, shows in UI
2. Refresh page: should see `[Sync] Nothing changed, skipping` in console
3. Wait 5 minutes: periodic poll runs (check console)

**Step 3: Final commit**

```bash
jj describe -m "feat: incremental Subsonic sync — complete"
```
