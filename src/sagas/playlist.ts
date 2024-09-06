import { takeLatest, select, call, put } from 'redux-saga/effects'

import { getAdapter } from '../services/database'
import { getQueue } from './selectors'
import PlaylistService from '../services/PlaylistService'
import logger from '../utils/logger'
import * as types from '../constants/ActionTypes'

const adapter = getAdapter()
const playlistService = new PlaylistService(adapter)

// Application initialization routines
function* initialize(): Generator<any, void, any> {
  yield playlistService.initialize
  logger.log('playlist-saga', 'initializing playlists')
  const playlists = yield call(playlistService.get)
  if (!playlists) {
    logger.log('playlists-saga', 'error retrieving playlists')
    yield put({type: types.GET_PLAYLISTS_REJECTED})
  } else {
    const unserialized = JSON.parse(JSON.stringify(playlists))
    logger.log('playlists-saga', 'playlists recieved and unserialized')
    yield put({type: types.RECEIVE_PLAYLISTS, playlists: unserialized})
  }
}


export function* savePlaylist(action: any): any {
  logger.log('playlist-saga', 'saving playlist')
  const queue = yield select(getQueue)
  const playlist = {_id: action.name, trackIds: queue.trackIds}

  yield playlistService.save('playlist', playlist)
  yield initialize()
}

// Binding actions to sagas
function* playlistSaga(): any {
  yield takeLatest(types.INITIALIZED, initialize)
  yield takeLatest(types.SAVE_PLAYLIST, savePlaylist)
}

export default playlistSaga
