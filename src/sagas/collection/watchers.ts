import { type Effect, actionChannel, fork, take, put } from "redux-saga/effects";

import type { Channel } from "redux-saga";
import type { NormalizedMedia } from "../../utils/normalizeMedia";
import { saveToDbWorker } from "./workers";
import { getLiveStoreInstance } from "../../stores/livestore/accessor";
import { initializeSettingsAction } from "../../stores/livestore/actions/settings";
import * as types from "../../constants/ActionTypes";
import { createLogger } from "../../utils/logger";

const logger = createLogger({ namespace: "collection-watchers" });

export function* addToCollectionWatcher(): Generator<Effect, void, unknown> {
  const handleChannel = (yield actionChannel(types.ADD_TO_COLLECTION)) as Channel<{ data: Array<NormalizedMedia> }>;

  while (true) {
    const { data } = (yield take(handleChannel)) as { data: Array<NormalizedMedia> };

    try {
      yield fork(saveToDbWorker, data);
      yield take([
        types.SAVE_COLLECTION_FULLFILLED,
        types.SAVE_COLLECTION_FAILED,
      ]);
      yield put({ type: types.RECEIVE_COLLECTION_FINISHED });
    } catch (error) {
      yield put({ type: "ADD_TO_COLLECTION_HANDLER_FAILED", error });
    }
  }
}

// Application initialization routines
export function* initializeWatcher(): Generator<Effect, void, unknown> {
  while (true) {
    yield take(types.INITIALIZE);
    
    try {
      logger.info("Starting application initialization...");
      
      // Get LiveStore instance
      const liveStore = getLiveStoreInstance();
      
      if (!liveStore) {
        throw new Error("LiveStore not available");
      }
      
      // Initialize settings via LiveStore (non-blocking)
      logger.debug("Initializing LiveStore settings...");
      yield fork(() => initializeSettingsAction(liveStore as unknown as Parameters<typeof initializeSettingsAction>[0]));
      
      // That's it! LiveStore handles:
      // - Database initialization (wa-sqlite)
      // - Schema migrations
      // - Data persistence
      // - Reactive queries
      // Components will load data via LiveStore hooks as needed
      
      // Flip uiStore flags before the action stream so saga consumers and
      // ready-gated UI (JoinRoom) react with the store already settled.
      logger.info("Dispatching INITIALIZED action");
      yield put({ type: types.INITIALIZED });
      logger.info("Initialization complete");
      
    } catch (error: unknown) {
      logger.error("Initialization failed:", error);
      yield put({
        type: types.SEND_NOTIFICATION,
        notification: `Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`,
        level: "error",
        duration: 10000
      });
    }
  }
}
