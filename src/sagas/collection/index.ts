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
    const settings = yield select((state: RootState) => state.settings.settings)
    if (!settings?.providers) {
      console.warn('No providers configured')
      return
    }

    const providersService = new ProvidersService(settings)
    const activeProvider = Object.values(providersService.providers)[0]
    
    if (!activeProvider?.getRecentMedia) {
      console.warn('Current provider does not support fetching recent media')
      return
    }

    // Get recent media items
    const recentMedia: IMedia[] = yield call([activeProvider, activeProvider.getRecentMedia])
    
    // Extract unique albums from media items
    const uniqueAlbums = new Map()
    recentMedia.forEach((media: IMedia) => {
      if (!uniqueAlbums.has(media.album.id)) {
        uniqueAlbums.set(media.album.id, {
          id: media.album.id,
          title: media.album.name,
          name: media.album.name,
          artist: media.album.artist,
          artistName: media.album.artist.name,
          album: media.album,
          cover: media.cover,
          type: 'audio',
          genres: [],
          stream: media.stream
        })
      }
    })

    yield put({ 
      type: types.FETCH_RECENT_ALBUMS_SUCCESS, 
      albums: Array.from(uniqueAlbums.values()) 
    })
  } catch (error) {
    console.error('Error fetching recent albums:', error)
    yield put({ type: types.FETCH_RECENT_ALBUMS_ERROR, error })
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
