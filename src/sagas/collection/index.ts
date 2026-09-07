// Binding actions to sagas
import { takeLatest, fork, call, put, delay, take } from "redux-saga/effects";
import type { SagaIterator } from "redux-saga";
import * as types from "../../constants/ActionTypes";
import { addToCollectionWatcher, initializeWatcher } from "./watchers";
import { getSettingsFromLiveStore } from "../selectors";
import ProvidersService from "../../services/ProvidersService";
import { getLiveStoreInstance } from "../../stores/livestore/accessor";
import { batchedMediaCommitter } from "../../stores/livestore/services/BatchedMediaCommitter";
import { resumeFor, save as saveResumeState } from "../../stores/livestore/services/SyncResumeState";
import { createLogger } from "../../utils/logger";
import type { AlbumPage } from "../../providers/IMusicProvider";


import {
  deleteCollectionWorker,
  exportCollectionWorker,
  importCollectionWorker,
  removeFromDbWorker,
  trackSongPlayed,
} from "./workers";

const logger = createLogger({ namespace: "SyncSaga" });

const MAX_PAGES_PER_SESSION = 10;
// Page geometry for streaming sync. Persisted per provider in the resume
// state so a change here invalidates stored cursors instead of silently
// skipping albums.
const SYNC_PAGE_SIZE = 50;


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
    // Row identity for sync resume state = the settings record key, which is
    // unique per configured instance (subsonic, subsonic2, ...). The class's
    // self-reported providerKey is display-only and may collide across
    // instances of the same type.
    const allEntries = Object.entries(providersService.providers);
    type StreamingEntry = { key: string; provider: (typeof allEntries)[number][1] };
    const providers: StreamingEntry[] = [];
    for (const [key, p] of allEntries) {
      if (p.getScanStatus && p.streamAlbumsSince) {
        providers.push({ key, provider: p });
      } else {
        logger.debug(
          `Provider ${key} skipped: missing ${!p.getScanStatus ? "getScanStatus" : "streamAlbumsSince"}`,
        );
      }
    }
    if (providers.length === 0) {
      logger.warn("No providers support streaming sync");
      return;
    }

    batchedMediaCommitter.setStore(liveStore)

    try {
      for (const { key, provider } of providers) {
        try {
          const scanStatus: { scanning: boolean; count: number; lastScan: string } =
            yield call([provider, provider.getScanStatus!]);
          if (scanStatus.scanning) {
            logger.debug(`Server ${key} is scanning, skipping this cycle`);
            continue;
          }

          const { since, cursor } = yield call(() =>
            resumeFor(liveStore, key, scanStatus, SYNC_PAGE_SIZE)
          );

          const stream = provider.streamAlbumsSince!(since, { cursor, pageSize: SYNC_PAGE_SIZE });
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
              yield call([batchedMediaCommitter, "add"], page.media, { skipRefresh: true });
              yield call([batchedMediaCommitter, "flush"], { skipRefresh: true });
            }
            nextCursor = page.nextCursor;
            complete = !page.hasMore;
            pages++;

            yield call(() =>
              saveResumeState(liveStore, key, {
                scanStatus,
                cursor: nextCursor,
                complete,
                pageSize: SYNC_PAGE_SIZE,
              })
            );

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
    } finally {
      // Ensure already-committed media becomes visible even after errors.
      yield call([batchedMediaCommitter, "refresh"], "SyncSaga.syncMediaLibrary");
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
