import { takeLatest, select, call, put, takeEvery } from "redux-saga/effects";

import { getAdapter } from "../services/database";
import { getQueue } from "./selectors";
import PlaylistService from "../services/PlaylistService";
import SmartPlaylistsService from "../services/SmartPlaylistsService";
import logger from "../utils/logger";
import * as types from "../constants/ActionTypes";

const adapter = getAdapter();
const playlistService = new PlaylistService(adapter);
const smartPlaylistsService = new SmartPlaylistsService(adapter);

// Application initialization routines
function* initialize(): Generator<any, void, any> {
  yield playlistService.initialize();
  yield smartPlaylistsService.initialize();
  logger.log("playlist-saga", "initializing playlists");
  const playlists = yield call(playlistService.get);
  if (!playlists) {
    logger.log("playlists-saga", "error retrieving playlists");
    yield put({ type: types.GET_PLAYLISTS_REJECTED });
  } else {
    const unserialized = JSON.parse(JSON.stringify(playlists));
    logger.log("playlists-saga", "playlists recieved and unserialized");
    yield put({ type: types.RECEIVE_PLAYLISTS, playlists: unserialized });
  }
  const smartPlaylists = yield call(smartPlaylistsService.get);
  if (!smartPlaylists) {
    logger.log("playlists-saga", "error retrieving smart playlists");
    yield put({ type: types.GET_SMART_PLAYLISTS_REJECTED });
  } else {
    yield put({ type: types.RECEIVE_SMART_PLAYLISTS, playlists: smartPlaylists });
  }
}

export function* savePlaylist(action: any): any {
  logger.log("playlist-saga", "saving playlist");
  const queue = yield select(getQueue);
  const playlist = {
    _id: action.name,
    name: action.name,
    trackIds: queue.trackIds,
  };

  yield playlistService.save("playlist", playlist);
  yield initialize();
}

function* saveSmartPlaylist(action: any): any {
  yield smartPlaylistsService.save("smartPlaylist", action.playlist);
  yield initialize();
}

// Binding actions to sagas
function* playlistSaga(): any {
  yield takeLatest(types.INITIALIZED, initialize);
  yield takeLatest(types.SAVE_PLAYLIST, savePlaylist);
  yield takeEvery(types.SAVE_SMART_PLAYLIST, saveSmartPlaylist);
}

export default playlistSaga;
