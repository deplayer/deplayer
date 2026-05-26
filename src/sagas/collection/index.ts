// Binding actions to sagas
import { takeLatest, fork, call, put, delay, take } from "redux-saga/effects";
import * as types from "../../constants/ActionTypes";
import { addToCollectionWatcher, initializeWatcher } from "./watchers";
import { NormalizedMedia } from "../../utils/normalizeMedia";
import { getSettingsFromLiveStore } from "../selectors";
import ProvidersService from "../../services/ProvidersService";
import { getLiveStoreInstance } from "../../App";
import { batchedMediaCommitter } from "../../stores/livestore/services/BatchedMediaCommitter";
import { syncEvents } from "../../stores/livestore/events/sync";
import { createLogger } from "../../utils/logger";
import { ProviderInstance } from "../../services/ProvidersService";

type LiveStoreInstance = NonNullable<ReturnType<typeof getLiveStoreInstance>>;

import {
  deleteCollectionWorker,
  exportCollectionWorker,
  importCollectionWorker,
  removeFromDbWorker,
  trackSongPlayed,
} from "./workers";

const logger = createLogger({ namespace: "SyncSaga" });

interface SyncState {
  lastSyncTimestamp: string;
  lastKnownCount: number;
  initialSyncCursor: number;
  initialSyncComplete: boolean;
}

function* readSyncState(liveStore: LiveStoreInstance): Generator<any, SyncState | null, any> {
  try {
    const result = yield call(() =>
      liveStore.query({
        query: "SELECT id, lastSyncTimestamp, lastKnownCount, initialSyncCursor, initialSyncComplete FROM sync_state WHERE id = 'default'",
        bindValues: {},
      })
    );
    const rows = (result as Array<{ values: unknown[][] }>)?.[0]?.values || [];
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      lastSyncTimestamp: row[1] as string,
      lastKnownCount: row[2] as number,
      initialSyncCursor: row[3] as number,
      initialSyncComplete: row[4] === 1,
    };
  } catch {
    return null;
  }
}

function* updateSyncState(
  liveStore: LiveStoreInstance,
  state: SyncState
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

function* progressiveHydration(
  provider: ProviderInstance,
  liveStore: LiveStoreInstance,
  syncState: SyncState | null,
  scanStatus: { lastScan: string; count: number }
): Generator<any, void, any> {
  const BATCH_SIZE = 50;
  const MAX_BATCHES_PER_SESSION = 10;
  const BATCHES_PER_REFRESH = 5;
  let cursor = syncState?.initialSyncCursor || 0;
  let batchesProcessed = 0;
  let batchesSinceRefresh = 0;

  batchedMediaCommitter.setStore(liveStore);

  while (batchesProcessed < MAX_BATCHES_PER_SESSION) {
    const batch: { media: NormalizedMedia[]; hasMore: boolean } = yield call(
      // @ts-expect-error TODO Task 6: replace with streamAlbumsSince
      [provider, provider.getAlbumsBatch!],
      cursor,
      BATCH_SIZE
    );

    if (batch.media.length > 0) {
      yield call([batchedMediaCommitter, "add"], batch.media);
      batchesSinceRefresh++;
    }

    cursor += BATCH_SIZE;
    batchesProcessed++;

    if (!batch.hasMore) {
      yield call([batchedMediaCommitter, "flush"]);
      yield call(updateSyncState, liveStore, {
        lastSyncTimestamp: scanStatus.lastScan,
        lastKnownCount: scanStatus.count,
        initialSyncCursor: cursor,
        initialSyncComplete: true,
      });
      logger.debug("Initial hydration complete");
      return;
    }

    // Only flush every N batches to reduce reactive cascades
    if (batchesSinceRefresh >= BATCHES_PER_REFRESH) {
      yield call([batchedMediaCommitter, "flush"]);
      batchesSinceRefresh = 0;
      yield delay(500);
    }

    yield call(updateSyncState, liveStore, {
      lastSyncTimestamp: scanStatus.lastScan,
      lastKnownCount: scanStatus.count,
      initialSyncCursor: cursor,
      initialSyncComplete: false,
    });
  }

  // Flush any remaining items
  if (batchesSinceRefresh > 0) {
    yield call([batchedMediaCommitter, "flush"]);
  }

  logger.debug(`Hydration paused at cursor ${cursor}, will resume next session`);
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
      // @ts-expect-error TODO Task 6: replace with streamAlbumsSince
      (p) => p.getScanStatus && p.getNewestAlbumsSince
    );

    if (providers.length === 0) {
      console.warn("No providers support incremental sync");
      return;
    }

    const syncState: SyncState | null = yield call(readSyncState, liveStore);
    batchedMediaCommitter.setStore(liveStore);

    for (const provider of providers) {
      try {
        // Step 1: Check if anything changed
        const scanStatus: { scanning: boolean; count: number; lastScan: string } =
          yield call([provider, provider.getScanStatus!]);

        if (scanStatus.scanning) {
          logger.debug("Server is scanning, skipping this cycle");
          continue;
        }

        if (
          syncState &&
          syncState.lastSyncTimestamp === scanStatus.lastScan &&
          syncState.lastKnownCount === scanStatus.count
        ) {
          logger.debug("Nothing changed, skipping");

          // Still do initial hydration if incomplete
      // @ts-expect-error TODO Task 6: replace with streamAlbumsSince
          if (!syncState.initialSyncComplete && provider.getAlbumsBatch) {
            yield call(progressiveHydration, provider, liveStore, syncState, scanStatus);
          }
          continue;
        }

        // Step 2: Fetch only new albums (or initial batch on first sync)
        if (syncState?.lastSyncTimestamp) {
          logger.debug(`Fetching albums newer than ${syncState.lastSyncTimestamp}`);
          const newMedia: NormalizedMedia[] = yield call(
          // @ts-expect-error TODO Task 6: replace with streamAlbumsSince
            [provider, provider.getNewestAlbumsSince!],
            syncState.lastSyncTimestamp
          );

          if (newMedia.length > 0) {
            yield call([batchedMediaCommitter, "add"], newMedia);
            yield call([batchedMediaCommitter, "flush"]);
            logger.debug(`Added ${newMedia.length} new songs`);
          }
        // @ts-expect-error TODO Task 6: replace with streamAlbumsSince
        } else if (provider.getAlbumsBatch) {
          // First sync ever — fetch initial batch for immediate UI
          logger.debug("First sync — fetching initial batch");
          const batch: { media: NormalizedMedia[]; hasMore: boolean } = yield call(
          // @ts-expect-error TODO Task 6: replace with streamAlbumsSince
            [provider, provider.getAlbumsBatch!],
            0,
            50
          );
          if (batch.media.length > 0) {
            yield call([batchedMediaCommitter, "add"], batch.media);
            yield call([batchedMediaCommitter, "flush"]);
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
        // @ts-expect-error TODO Task 6: replace with streamAlbumsSince
        if (!isComplete && provider.getAlbumsBatch) {
          const updatedSyncState: SyncState | null = yield call(readSyncState, liveStore);
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

function* periodicSyncPoll(): Generator<any, void, any> {
  while (true) {
    yield delay(5 * 60 * 1000); // 5 minutes
    yield call(syncMediaLibrary);
  }
}

function* deferredSync(): Generator<any, void, any> {
  // Wait for INITIALIZED, then give the UI ~5s to finish first paint and
  // hydrate visible rows before kicking off the heavy media library scan.
  // Empirical — shorter delays cause visible jank on cold start.
  yield take(types.INITIALIZED);
  yield delay(5000);
  yield call(syncMediaLibrary);
}

function* collectionSaga(): Generator<any, void, any> {
  yield takeLatest(types.REMOVE_FROM_COLLECTION, removeFromDbWorker);
  yield takeLatest(types.DELETE_COLLECTION, deleteCollectionWorker);
  yield takeLatest(types.EXPORT_COLLECTION, exportCollectionWorker);
  yield takeLatest(types.IMPORT_COLLECTION, importCollectionWorker);
  yield takeLatest(types.SONG_PLAYED, trackSongPlayed);
  yield fork(deferredSync);
  yield fork(periodicSyncPoll);
  yield fork(initializeWatcher);
  yield fork(addToCollectionWatcher);
}

export default collectionSaga;
