import { call, actionChannel, fork, take, put } from "redux-saga/effects";

import { saveToDbWorker } from "./workers";
import { getAdapter } from "../../services/database";
import { getLiveStoreInstance } from "../../App";
import { initializeSettingsAction } from "../../stores/livestore/actions/settings";
import CollectionService from "../../services/CollectionService";
import * as types from "../../constants/ActionTypes";
import { createLogger } from "../../utils/logger";

const adapter = getAdapter();
const collectionService = new CollectionService(adapter);
const logger = createLogger({ namespace: "collection-watchers" });

export function* addToCollectionWatcher(): any {
  const handleChannel = yield actionChannel(types.ADD_TO_COLLECTION);

  while (true) {
    const { data } = yield take(handleChannel);

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
export function* initializeWatcher(): Generator<any, void, any> {
  while (true) {
    yield take(types.INITIALIZE);
    
    try {
      // Ensure database is ready
      logger.debug("Waiting for database initialization...");
      yield call(adapter.getDb);
      logger.debug("Database initialized successfully");

      // Initialize settings via LiveStore
      const liveStore = getLiveStoreInstance();
      if (liveStore) {
        logger.debug("Initializing LiveStore settings...");
        yield call(initializeSettingsAction, liveStore);
        logger.debug("LiveStore settings initialized");
      } else {
        logger.warn("LiveStore not available for settings initialization");
      }
      
      // Initialize collection
      yield call(collectionService.initialize);
      
      const collection = yield call(collectionService.getAll);
      const mappedData = collection.map((elem: any) => elem);

      // If collection is empty, show empty state
      if (mappedData.length === 0) {
        yield put({ type: types.RECEIVE_COLLECTION, data: [] });
      } else {
        yield put({ type: types.RECEIVE_COLLECTION, data: mappedData });
      }

      yield put({ type: types.INITIALIZED });
      yield put({ type: types.APPLY_MOST_PLAYED_SORT });
    } catch (error: any) {
      logger.error("Initialization failed:", error);
      yield put({ 
        type: types.SEND_NOTIFICATION, 
        notification: `Failed to initialize: ${error?.message || 'Unknown error'}`,
        level: "error",
        duration: 10000
      });
    }
  }
}
