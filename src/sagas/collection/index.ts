// Binding actions to sagas
import { takeLatest, fork, call, put, delay, take } from "redux-saga/effects";
import type { SagaIterator } from "redux-saga";
import * as types from "../../constants/ActionTypes";
import { addToCollectionWatcher, initializeWatcher } from "./watchers";
import { getSettingsFromLiveStore } from "../selectors";
import ProvidersService from "../../services/ProvidersService";
import { getLiveStoreInstance } from "../../stores/livestore/accessor";
import { batchedMediaCommitter } from "../../stores/livestore/services/BatchedMediaCommitter";
import {
  syncProvider,
  isStreamingProvider,
  type StreamingProvider,
} from "../../stores/livestore/services/ProviderSync";
import { createLogger } from "../../utils/logger";

import {
  deleteCollectionWorker,
  exportCollectionWorker,
  importCollectionWorker,
  removeFromDbWorker,
  trackSongPlayed,
} from "./workers";

const logger = createLogger({ namespace: "SyncSaga" });

export function* syncMediaLibrary(): SagaIterator<void> {
  try {
    const liveStore = getLiveStoreInstance();
    if (!liveStore) {
      logger.warn("LiveStore not available");
      return;
    }

    const settings = yield* getSettingsFromLiveStore();
    if (!settings?.providers) return;

    const providersService = new ProvidersService(settings);
    // Row identity for sync resume state = the settings record key, which is
    // unique per configured instance (subsonic, subsonic2, ...). The class's
    // self-reported providerKey is display-only and may collide across
    // instances of the same type.
    const allEntries = Object.entries(providersService.providers);
    const providers: { key: string; provider: StreamingProvider }[] = [];
    for (const [key, p] of allEntries) {
      if (isStreamingProvider(p)) {
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

    try {
      for (const { key, provider } of providers) {
        yield call(syncProvider, liveStore, key, provider);
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
