// Binding actions to sagas
import { takeLatest, fork, call, put, select } from "redux-saga/effects";
import * as types from "../../constants/ActionTypes";
import { addToCollectionWatcher, initializeWatcher } from "./watchers";
import { IMedia } from "../../entities/Media";
import { State as RootState } from "../../reducers";
import ProvidersService from "../../services/ProvidersService";

import {
  deleteCollectionWorker,
  exportCollectionWorker,
  importCollectionWorker,
  removeFromDbWorker,
  trackSongPlayed,
} from "./workers";

function* fetchRecentAlbums(): Generator<any, void, any> {
  try {
    const settings = yield select(
      (state: RootState) => state.settings.settings
    );
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
        console.log("providerMedia", providerMedia);
        allRecentMedia.push(...providerMedia);
      } catch (error) {
        console.error(
          `Error fetching recent media from provider ${provider.name}:`,
          error
        );
      }
    }

    // Extract unique albums from media items
    const uniqueAlbums = new Map();
    allRecentMedia.forEach((media: IMedia) => {
      if (!uniqueAlbums.has(media.album.id)) {
        uniqueAlbums.set(media.album.id, {
          id: media.album.id,
          title: media.album.name,
          name: media.album.name,
          artist: media.album.artist,
          artistName: media.album.artist.name,
          album: media.album,
          cover: media.cover,
          type: "audio",
          genres: [],
          stream: media.stream,
        });
      }
    });

    console.log("uniqueAlbums", uniqueAlbums);

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
  yield takeLatest(types.APP_READY, fetchRecentAlbums);
  yield fork(initializeWatcher);
  yield fork(addToCollectionWatcher);
}

export default collectionSaga;
