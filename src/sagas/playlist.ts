import { takeLatest, select } from 'redux-saga/effects'

import { getAdapter } from '../services/database'
import PlaylistService from '../services/PlaylistService'
import logger from '../utils/logger'

import * as types from '../constants/ActionTypes'

export const getQueue = (state: any): any => {
  return state ? state.queue : {}
}

export const getAlbumSongs = (state: any): any => {
  return state ? state.collection.songsByAlbum : {}
}

const adapter = getAdapter()
const queueService = new PlaylistService(new adapter())

export function* savePlaylist(action: any): any {
  logger.log('playlist-saga', 'saving playlist')
  const queue = yield select(getQueue)
  const playlist = {_id: action.name, trackIds: queue.trackIds}

  yield queueService.save('playlist', playlist)
}

// Binding actions to sagas
function* playlistSaga(): any {
  yield takeLatest(types.SAVE_PLAYLIST, savePlaylist)
}

export default playlistSaga
