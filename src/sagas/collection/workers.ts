// Handling ADD_TO_COLLECTION saga
import { put, call, select } from "redux-saga/effects";

import { getAdapter } from "../../services/database";
import { getLiveStoreInstance } from "../../App";
import { addMediaBulkAction, removeMediaAction, trackMediaPlayedAction } from "../../stores/livestore/actions/media";
import { getCollection } from "../selectors";
import CollectionService from "../../services/CollectionService";
import logger from "../../utils/logger";
import rowToSong from "../../mappers/rowToSong";
import * as types from "../../constants/ActionTypes";

const adapter = getAdapter();
const collectionService = new CollectionService(adapter);

export function* saveToDbWorker(data: Array<any>): any {
  const prevCollection = yield select(getCollection);
  try {
    // Write to PGlite database (existing behavior)
    yield call(collectionService.bulkSave, data, prevCollection);
    
    // Dual-write: Also write to LiveStore
    const liveStore = getLiveStoreInstance();
    if (liveStore && data.length > 0) {
      try {
        logger.debug(`Syncing ${data.length} new media items to LiveStore...`);
        yield call(addMediaBulkAction, liveStore, data);
        logger.debug("New media synced to LiveStore successfully");
      } catch (liveStoreError: any) {
        logger.error("Failed to sync new media to LiveStore:", liveStoreError);
        // Continue anyway - PGlite has the data
      }
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
    // Write to PGlite database (existing behavior)
    yield collectionService.bulkRemove(action.data);
    
    // Dual-write: Also remove from LiveStore
    const liveStore = getLiveStoreInstance();
    if (liveStore && action.data && action.data.length > 0) {
      try {
        logger.debug(`Removing ${action.data.length} media items from LiveStore...`);
        for (const mediaId of action.data) {
          yield call(removeMediaAction, liveStore, mediaId);
        }
        logger.debug("Media removed from LiveStore successfully");
      } catch (liveStoreError: any) {
        logger.error("Failed to remove media from LiveStore:", liveStoreError);
        // Continue anyway - PGlite has been updated
      }
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
    yield collectionService.removeAll();
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
    const exported = yield collectionService.exportCollection();
    yield put({ type: types.EXPORT_COLLECTION_FINISHED, exported });
  } catch (e: any) {
    yield put({ type: types.EXPORT_COLLECTION_REJECTED, message: e.message });
  }
}

export function* importCollectionWorker(action: {
  type: string;
  data: any;
}): any {
  logger.log("settings-saga", "importingCollection");
  const result = yield collectionService.importCollection(action.data);
  yield put({ type: types.IMPORT_COLLECTION_FINISHED, result });
}

export function* trackSongPlayed(action: {
  type: string;
  songId: string;
}): any {
  yield call(collectionService.initialize);
  const songRows = yield call(collectionService.get, action.songId);
  
  // Handle case where no song is found
  if (!songRows || !songRows.length) {
    logger.warn(`Song with id ${action.songId} not found in database`);
    return;
  }

  const song = rowToSong(songRows[0]);
  const prevCount = song.playCount || 0;
  song.playCount = prevCount + 1;
  const songDocument = song.toDocument();
  
  // Write to PGlite database (existing behavior)
  yield call(collectionService.save, action.songId, songDocument);
  
  // Dual-write: Also track in LiveStore
  const liveStore = getLiveStoreInstance();
  if (liveStore) {
    try {
      logger.debug(`Tracking play for song ${action.songId} in LiveStore...`);
      yield call(trackMediaPlayedAction, liveStore, action.songId);
      logger.debug("Play count tracked in LiveStore successfully");
    } catch (liveStoreError: any) {
      logger.error("Failed to track play in LiveStore:", liveStoreError);
      // Continue anyway - PGlite has been updated
    }
  }
  
  yield put({ type: "SONG_SAVED" });
  yield put({ type: types.UPDATE_MEDIA, media: songDocument });
}
