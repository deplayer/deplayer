// Binding actions to sagas
import { takeLatest, fork, call, put, delay, take } from "redux-saga/effects";
import type { SagaIterator } from "redux-saga";
import * as types from "../../constants/ActionTypes";
import { addToCollectionWatcher, initializeWatcher } from "./watchers";
import { getSettingsFromLiveStore } from "../selectors";
import ProvidersService from "../../services/ProvidersService";
import { getLiveStoreInstance } from "../../App";
import { batchedMediaCommitter } from "../../stores/livestore/services/BatchedMediaCommitter";
import { syncEvents } from "../../stores/livestore/events/sync";
import { createLogger } from "../../utils/logger";
import type { AlbumPage } from "../../providers/IMusicProvider";

type LiveStoreInstance = NonNullable<ReturnType<typeof getLiveStoreInstance>>;

import {
  deleteCollectionWorker,
  exportCollectionWorker,
  importCollectionWorker,
  removeFromDbWorker,
  trackSongPlayed,
} from "./workers";

const logger = createLogger({ namespace: "SyncSaga" });

const MAX_PAGES_PER_SESSION = 10;

interface SyncState {
  lastSyncTimestamp: string;
  lastKnownCount: number;
  initialSyncCursor: number;
  initialSyncComplete: boolean;
}

function* readSyncState(liveStore: LiveStoreInstance): SagaIterator<SyncState | null> {
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
  state: SyncState,
): SagaIterator<void> {
  yield call(() =>
    liveStore.commit(
      syncEvents.syncStateUpdated({ id: "default", ...state }),
    ),
  );
}

export function* syncMediaLibrary(): SagaIterator<void> {
  try {
    const liveStore = getLiveStoreInstance();
    if (!liveStore) {
      logger.warn("LiveStore not available");
      return;
    }

    const settings = yield call(getSettingsFromLiveStore);
    if (!settings?.providers) return;

    const providersService = new ProvidersService(settings);
    const allProviders = Object.values(providersService.providers);
    const providers: typeof allProviders = [];
    for (const p of allProviders) {
      if (p.getScanStatus && p.streamAlbumsSince) {
        providers.push(p);
      } else {
        logger.debug(
          `Provider ${p.providerKey} skipped: missing ${!p.getScanStatus ? "getScanStatus" : "streamAlbumsSince"}`,
        );
      }
    }
    if (providers.length === 0) {
      logger.warn("No providers support streaming sync");
      return;
    }

    const syncState: SyncState | null = yield call(readSyncState, liveStore);
    batchedMediaCommitter.setStore(liveStore);

    for (const provider of providers) {
      try {
        const scanStatus: { scanning: boolean; count: number; lastScan: string } =
          yield call([provider, provider.getScanStatus!]);
        if (scanStatus.scanning) {
          logger.debug(`Server ${provider.providerKey} is scanning, skipping this cycle`);
          continue;
        }

        // Cursor-regression guard. Reset cursor + since to null (full re-sync)
        // when any of these hold:
        //   - server's lastScan is missing/invalid (no scan ever recorded);
        //   - server's lastScan is OLDER than the one we persisted (server DB
        //     swap or restore-from-backup);
        //   - server's row count dropped (library wipe / partial restore).
        // Without the explicit lastScan-presence check, an invalid Date would
        // make the comparison return false and we'd advance with a stale cursor.
        const serverScanMs = scanStatus.lastScan ? new Date(scanStatus.lastScan).getTime() : NaN;
        const localScanMs = syncState ? new Date(syncState.lastSyncTimestamp).getTime() : NaN;
        const regressed =
          !!syncState &&
          (!Number.isFinite(serverScanMs) ||
            !Number.isFinite(localScanMs) ||
            serverScanMs < localScanMs ||
            scanStatus.count < syncState.lastKnownCount);
        const since = regressed ? null : (syncState?.lastSyncTimestamp ?? null);
        const cursor: number | null = regressed ? null : (syncState?.initialSyncCursor ?? null);

        const stream = provider.streamAlbumsSince!(since, { cursor });
        let pages = 0;
        let nextCursor: number | null = cursor;
        let complete = false;

        for (;;) {
          const next: IteratorResult<AlbumPage, void> = yield call(() => stream.next());
          if (next.done) {
            complete = true;
            break;
          }
          const page = next.value;

          if (page.media.length > 0) {
            yield call([batchedMediaCommitter, "add"], page.media);
            yield call([batchedMediaCommitter, "flush"]);
          }
          nextCursor = page.nextCursor;
          complete = !page.hasMore;
          pages++;

          yield call(updateSyncState, liveStore, {
            lastSyncTimestamp: scanStatus.lastScan,
            lastKnownCount: scanStatus.count,
            initialSyncCursor: nextCursor ?? 0,
            initialSyncComplete: complete,
          });

          if (complete || pages >= MAX_PAGES_PER_SESSION) break;
        }

        if (!complete) {
          // Best-effort cleanup; the provider generator currently has no
          // finally block, but a future impl might. Swallow cleanup errors
          // so they don't poison the outer catch.
          yield call(async () => {
            try {
              await stream.return?.();
            } catch (cleanupError) {
              logger.error(`stream.return failed for ${provider.providerKey}`, cleanupError);
            }
          });
          logger.debug(
            `Sync paused for ${provider.providerKey} at cursor ${nextCursor} (page cap reached)`,
          );
        } else {
          logger.debug(`Sync complete for ${provider.providerKey}`);
        }
      } catch (error) {
        logger.error(`Provider sync failed (${provider.providerKey})`, error);
      }
    }
  } catch (error) {
    logger.error("syncMediaLibrary failed", error);
    yield put({ type: types.FETCH_RECENT_ALBUMS_ERROR, error });
  }
}

function* periodicSyncPoll(): SagaIterator<void> {
  while (true) {
    yield delay(5 * 60 * 1000);
    yield call(syncMediaLibrary);
  }
}

function* deferredSync(): SagaIterator<void> {
  yield take(types.INITIALIZED);
  yield delay(5000);
  yield call(syncMediaLibrary);
}

function* collectionSaga(): SagaIterator<void> {
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
