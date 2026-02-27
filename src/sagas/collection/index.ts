// Binding actions to sagas
import { takeLatest, fork, call, put } from "redux-saga/effects";
import * as types from "../../constants/ActionTypes";
import { addToCollectionWatcher, initializeWatcher } from "./watchers";
import { IMedia } from "../../entities/Media";
import { getSettingsFromLiveStore } from "../selectors";
import ProvidersService from "../../services/ProvidersService";
import { getLiveStoreInstance } from "../../App";
import { queryDb } from "@livestore/livestore";
import { tables } from "../../stores/livestore/schema";
import { batchedMediaCommitter } from "../../stores/livestore/services/BatchedMediaCommitter";

import {
  deleteCollectionWorker,
  exportCollectionWorker,
  importCollectionWorker,
  removeFromDbWorker,
  trackSongPlayed,
} from "./workers";

export function* fetchRecentAlbums(): Generator<any, void, any> {
  try {
    // Get LiveStore instance
    const liveStore = getLiveStoreInstance();
    if (!liveStore) {
      console.warn("LiveStore not available");
      return;
    }

    // Try to get recent albums from LiveStore (ordered by most recent)
    const recentMediaQuery = queryDb(
      tables.media
        .select()
        .orderBy('createdAt', 'desc')
        .limit(50)
    );
    
    const recentMedia = yield call(() => liveStore.query(recentMediaQuery));

    if (recentMedia && recentMedia.length > 0) {
      // Extract unique albums from media items
      const uniqueAlbums = new Map();
      recentMedia.forEach((media: IMedia) => {
        if (media.album && !uniqueAlbums.has(media.album.id)) {
          uniqueAlbums.set(media.album.id, {
            id: media.album.id,
            title: media.album.name,
            name: media.album.name,
            artist: media.album.artist,
            artistName: media.album.artist?.name || '',
            album: media.album,
            cover: media.cover,
            type: "audio",
            genres: [],
            stream: media.stream,
          });
        }
      });

      // Dispatch the albums we found in LiveStore
      yield put({
        type: types.FETCH_RECENT_ALBUMS_SUCCESS,
        albums: Array.from(uniqueAlbums.values()),
      });
    }

    // Then try to fetch new albums from providers
    const settings = yield call(getSettingsFromLiveStore);
    if (!settings?.providers) {
      console.warn("No providers configured");
      return;
    }

    const providersService = new ProvidersService(settings);
    const enabledProviders = Object.values(providersService.providers).filter(
      (provider) => provider.getRecentMedia
    );

    if (enabledProviders.length === 0) {
      console.warn("No providers support fetching recent media");
      return;
    }

    // Get recent media from all enabled providers
    const allRecentMedia: IMedia[] = [];
    for (const provider of enabledProviders) {
      try {
        const providerMedia: IMedia[] = yield call([
          provider,
          provider.getRecentMedia,
        ]);
        allRecentMedia.push(...providerMedia);
      } catch (error) {
        console.error(
          `Error fetching recent media from provider ${provider.name}:`,
          error
        );
      }
    }

    // ===== PERFORMANCE FIX: Use BatchedMediaCommitter with skipRefresh =====
    // This prevents FPS drops by:
    // 1. Using skipRefresh during bulk insert (no intermediate UI updates)
    // 2. Calling manualRefresh() once after all items are inserted
    // 3. Chunking large batches to avoid blocking main thread
    
    if (allRecentMedia.length > 0) {
      try {
        // Initialize committer with store
        batchedMediaCommitter.setStore(liveStore)
        
        // Add all items - will be committed with skipRefresh
        yield call([batchedMediaCommitter, 'add'], allRecentMedia)
        
        // Force flush to ensure data is available before Redux dispatch
        yield call([batchedMediaCommitter, 'flush'])
      } catch (error) {
        console.error('[Collection Saga] LiveStore insert failed:', error)
        yield put({
          type: types.SEND_NOTIFICATION,
          notification: 'Failed to load media library',
          level: 'error',
        })
        throw error
      }
    }

    // Extract unique albums from media items
    const uniqueAlbums = new Map();
    allRecentMedia.forEach((media: IMedia) => {
      if (media.album && !uniqueAlbums.has(media.album.id)) {
        uniqueAlbums.set(media.album.id, {
          id: media.album.id,
          title: media.album.name,
          name: media.album.name,
          artist: media.album.artist,
          artistName: media.album.artist?.name || '',
          album: media.album,
          cover: media.cover,
          type: "audio",
          genres: [],
          stream: media.stream,
        });
      }
    });

    yield put({
      type: types.FETCH_RECENT_ALBUMS_SUCCESS,
      albums: Array.from(uniqueAlbums.values()),
    });
  } catch (error) {
    console.error("Error fetching recent albums:", error);
    yield put({ type: types.FETCH_RECENT_ALBUMS_ERROR, error });
  }
}

function* collectionSaga(): any {
  yield takeLatest(types.REMOVE_FROM_COLLECTION, removeFromDbWorker);
  yield takeLatest(types.DELETE_COLLECTION, deleteCollectionWorker);
  yield takeLatest(types.EXPORT_COLLECTION, exportCollectionWorker);
  yield takeLatest(types.IMPORT_COLLECTION, importCollectionWorker);
  yield takeLatest(types.SONG_PLAYED, trackSongPlayed);
  yield takeLatest(types.INITIALIZED, fetchRecentAlbums);
  yield fork(initializeWatcher);
  yield fork(addToCollectionWatcher);
}

export default collectionSaga;
