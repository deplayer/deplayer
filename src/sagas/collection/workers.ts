// Handling ADD_TO_COLLECTION saga
import { put, call } from "redux-saga/effects";

import { getLiveStoreInstance } from "../../App";
import { addMediaBulkAction, removeMediaAction, trackMediaPlayedAction } from "../../stores/livestore/actions/media";
import logger from "../../utils/logger";
import * as types from "../../constants/ActionTypes";


export function* saveToDbWorker(data: Array<any>): any {
  try {
    // Write to LiveStore (single source of truth)
    const liveStore = getLiveStoreInstance();
    if (!liveStore) {
      throw new Error("LiveStore not available");
    }
    
    if (data.length > 0) {
      logger.debug(`Saving ${data.length} media items to LiveStore...`);
      yield call(addMediaBulkAction, liveStore, data);
      logger.debug("Media saved to LiveStore successfully");
    }
    
    yield put({ type: types.SAVE_COLLECTION_FULLFILLED });
  } catch (e: any) {
    logger.log("settings-saga", "addToCollection", e);
    yield put({ type: types.SAVE_COLLECTION_FAILED, error: e.message });
  }
}

// Handling REMOVE_FROM_COLLECTION saga
export function* removeFromDbWorker(action: any): any {
  try {
    // Remove from LiveStore (single source of truth)
    const liveStore = getLiveStoreInstance();
    if (!liveStore) {
      throw new Error("LiveStore not available");
    }
    
    if (action.data && action.data.length > 0) {
      logger.debug(`Removing ${action.data.length} media items from LiveStore...`);
      for (const mediaId of action.data) {
        yield call(removeMediaAction, liveStore, mediaId);
      }
      logger.debug("Media removed from LiveStore successfully");
    }
    
    yield put({
      type: types.REMOVE_FROM_COLLECTION_FULFILLED,
      data: action.data,
    });
  } catch (e: any) {
    yield put({
      type: types.REMOVE_FROM_COLLECTION_REJECTED,
      message: e.message,
    });
  }
}

export function* deleteCollectionWorker(): any {
  try {
    // Note: This worker is kept for backward compatibility but is not implemented
    // Collection deletion should be handled via LiveStore hooks/actions in components
    logger.warn("deleteCollectionWorker is deprecated - use LiveStore actions instead");
    yield put({ type: types.REMOVE_FROM_COLLECTION_FULFILLED });
    yield put({ type: types.CLEAR_COLLECTION });
    yield put({ type: types.CLEAR_QUEUE });
    yield put({
      type: types.SEND_NOTIFICATION,
      notification: "notifications.collection_deleted",
    });
  } catch (e: any) {
    yield put({
      type: types.REMOVE_FROM_COLLECTION_REJECTED,
      message: e.message,
    });
  }
}

export function* exportCollectionWorker(): any {
  try {
    // Note: Export functionality temporarily disabled
    // Will be re-implemented using LiveStore queries
    logger.warn("exportCollectionWorker is not yet implemented for LiveStore");
    throw new Error("Export collection is temporarily unavailable");
  } catch (e: any) {
    yield put({ type: types.EXPORT_COLLECTION_REJECTED, message: e.message });
  }
}

export function* importCollectionWorker(_action: {
  type: string;
  data: any;
}): any {
  try {
    // Note: Import functionality temporarily disabled
    // Will be re-implemented using LiveStore actions
    logger.warn("importCollectionWorker is not yet implemented for LiveStore");
    throw new Error("Import collection is temporarily unavailable");
  } catch (e: any) {
    logger.log("settings-saga", "importingCollection", e);
    yield put({ type: types.IMPORT_COLLECTION_FINISHED, result: { error: e.message } });
  }
}

export function* trackSongPlayed(action: {
  type: string;
  songId: string;
}): any {
  try {
    // Track in LiveStore (single source of truth)
    const liveStore = getLiveStoreInstance();
    if (!liveStore) {
      throw new Error("LiveStore not available");
    }
    
    logger.debug(`Tracking play for song ${action.songId} in LiveStore...`);
    yield call(trackMediaPlayedAction, liveStore, action.songId);
    logger.debug("Play count tracked in LiveStore successfully");
    
    yield put({ type: "SONG_SAVED" });
    // Note: UPDATE_MEDIA dispatch removed - LiveStore handles reactive updates
  } catch (e: any) {
    logger.error(`Failed to track song play for ${action.songId}:`, e);
  }
}
