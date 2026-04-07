// Binding actions to sagas
import { takeLatest, fork, call, put, delay } from "redux-saga/effects";
import * as types from "../../constants/ActionTypes";
import { addToCollectionWatcher, initializeWatcher } from "./watchers";
import { IMedia } from "../../entities/Media";
import { getSettingsFromLiveStore } from "../selectors";
import ProvidersService from "../../services/ProvidersService";
import { getLiveStoreInstance } from "../../App";
import { batchedMediaCommitter } from "../../stores/livestore/services/BatchedMediaCommitter";
import { syncEvents } from "../../stores/livestore/events/sync";
import { createLogger } from "../../utils/logger";

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

function* readSyncState(liveStore: any): Generator<any, SyncState | null, any> {
  try {
    const result = yield call(() =>
      liveStore.query({
        query: "SELECT id, lastSyncTimestamp, lastKnownCount, initialSyncCursor, initialSyncComplete FROM sync_state WHERE id = 'default'",
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
  provider: any,
  liveStore: any,
  syncState: SyncState | null,
  scanStatus: { lastScan: string; count: number }
): Generator<any, void, any> {
  const BATCH_SIZE = 50;
  const MAX_BATCHES_PER_SESSION = 10;
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
      yield call(updateSyncState, liveStore, {
        lastSyncTimestamp: scanStatus.lastScan,
        lastKnownCount: scanStatus.count,
        initialSyncCursor: cursor,
        initialSyncComplete: true,
      });
      logger.debug("Initial hydration complete");
      return;
    }

    yield call(updateSyncState, liveStore, {
      lastSyncTimestamp: scanStatus.lastScan,
      lastKnownCount: scanStatus.count,
      initialSyncCursor: cursor,
      initialSyncComplete: false,
    });

    yield delay(100);
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
          if (!syncState.initialSyncComplete && provider.getAlbumsBatch) {
            yield call(progressiveHydration, provider, liveStore, syncState, scanStatus);
          }
          continue;
        }

        // Step 2: Fetch only new albums (or initial batch on first sync)
        if (syncState?.lastSyncTimestamp) {
          logger.debug(`Fetching albums newer than ${syncState.lastSyncTimestamp}`);
          const newMedia: IMedia[] = yield call(
            [provider, provider.getNewestAlbumsSince!],
            syncState.lastSyncTimestamp
          );

          if (newMedia.length > 0) {
            yield call([batchedMediaCommitter, "add"], newMedia);
            yield call([batchedMediaCommitter, "flush"]);
            logger.debug(`Added ${newMedia.length} new songs`);
          }
        } else if (provider.getAlbumsBatch) {
          // First sync ever — fetch initial batch for immediate UI
          logger.debug("First sync — fetching initial batch");
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

export default collectionSaga;
