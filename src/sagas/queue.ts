import { takeLatest, put, select, call } from 'redux-saga/effects'

import { getAdapter } from '../services/database'
import { getAlbumSongs, getQueue } from './selectors'
import QueueService from '../services/QueueService'
import logger from '../utils/logger'
import * as types from '../constants/ActionTypes'

// Extract songs from collection state
export const getSongs = (state: any, action: { path: string }): Array<string> => {
  if (action.path === 'search-results') {
    return state ? state.collection.searchResults : []
  }

  return state ? state.collection.visibleSongs : []
}

// Handling playAll saga
export function* playAll(action: any): any {
  const songs = yield select(getSongs, action)
  if (songs.length) {
    yield put({type: types.ADD_SONGS_TO_QUEUE, songs: Object.values(songs)})
    yield put({type: types.SET_CURRENT_PLAYING, songId: songs[0]})
    yield put({type: types.START_PLAYING})
  }
}

const adapter = getAdapter()
const queueService = new QueueService(new adapter())

export function* saveQueue(): any {
  logger.log('queue-saga', 'saving queue')
  const queue = yield select(getQueue)
  yield queueService.save('queue', queue)
}

export function* clearQueue(): any {
  logger.log('queue-saga', 'removing queue')
  yield queueService.save('queue', {})
}

export function* addAlbumToPlaylist(action: any): any {
  const songsByAlbum = yield select(getAlbumSongs)
  logger.log('queue-saga', songsByAlbum)
  yield put({type: types.ADD_SONGS_TO_QUEUE, songs: songsByAlbum[action.albumId], replace: true })
  yield put({type: types.SET_CURRENT_PLAYING, songId: songsByAlbum[action.albumId][0]})
  yield put({type: types.START_PLAYING})
}

// Application initialization routines
function* initialize() {
  yield queueService.initialize
  logger.log('queue-saga', 'initializing queue')
  const queue = yield call(queueService.get)
  if (!queue) {
    logger.log('queue-saga', 'error retrieving queue')
    yield put({type: types.GET_QUEUE_REJECTED})
  } else {
    const unserialized = JSON.parse(JSON.stringify(queue))
    logger.log('queue-saga', 'queue recieved and unserialized')
    yield put({type: types.RECEIVE_QUEUE, queue: unserialized})
  }
}

// Binding actions to sagas
function* queueSaga(): any {
  yield takeLatest(types.PLAY_ALL, playAll)
  yield takeLatest(types.ADD_SONGS_TO_QUEUE, saveQueue)
  yield takeLatest(types.CLEAR_QUEUE, clearQueue)
  yield takeLatest(types.INITIALIZED, initialize)
  yield takeLatest(types.ADD_ALBUM_TO_PLAYLIST, addAlbumToPlaylist)
}

export default queueSaga
