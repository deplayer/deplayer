// Binding actions to sagas
import { takeLatest, fork, call, put, delay, take } from "redux-saga/effects";
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
  state: SyncState,
): Generator<any, void, any> {
  yield call(() =>
    liveStore.commit(
      syncEvents.syncStateUpdated({ id: "default", ...state }),
    ),
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
      (p) => p.getScanStatus && p.streamAlbumsSince,
    );
    if (providers.length === 0) {
      console.warn("No providers support streaming sync");
      return;
    }

    const syncState: SyncState | null = yield call(readSyncState, liveStore);
    batchedMediaCommitter.setStore(liveStore);

    for (const provider of providers) {
      try {
        const scanStatus: { scanning: boolean; count: number; lastScan: string } =
          yield call([provider, provider.getScanStatus!]);
        if (scanStatus.scanning) {
          logger.debug("Server is scanning, skipping this cycle");
          continue;
        }

        // Cursor-regression guard: if the server's lastScan is older than ours,
        // OR the count dropped, restart from scratch. This handles server
        // rescans / DB swaps that would otherwise leave us with a stale cursor.
        const regressed =
          !!syncState &&
          (new Date(scanStatus.lastScan) < new Date(syncState.lastSyncTimestamp) ||
            scanStatus.count < syncState.lastKnownCount);
        const since = regressed ? null : (syncState?.lastSyncTimestamp ?? null);
        const cursor = regressed ? null : (syncState?.initialSyncCursor ?? null);

        const stream = provider.streamAlbumsSince!(since, {
          cursor: cursor != null ? String(cursor) : null,
        });
        let pages = 0;
        let lastCursor: string | null = cursor != null ? String(cursor) : null;
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
          lastCursor = page.nextCursor;
          complete = !page.hasMore;
          pages++;

          yield call(updateSyncState, liveStore, {
            lastSyncTimestamp: scanStatus.lastScan,
            lastKnownCount: scanStatus.count,
            initialSyncCursor: Number(lastCursor) || 0,
            initialSyncComplete: complete,
          });

          if (complete || pages >= MAX_PAGES_PER_SESSION) break;
        }

        if (!complete) {
          // Tell the generator we're done pulling so it can release resources.
          yield call(() => stream.return?.());
          logger.debug(
            `Sync paused for ${provider.providerKey} at cursor ${lastCursor} (page cap reached)`,
          );
        } else {
          logger.debug(`Sync complete for ${provider.providerKey}`);
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
    yield delay(5 * 60 * 1000);
    yield call(syncMediaLibrary);
  }
}

function* deferredSync(): Generator<any, void, any> {
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
