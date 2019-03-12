import { takeLatest, put, select, call } from 'redux-saga/effects'

import { getAdapter } from '../services/adapters'
import QueueService from '../services/QueueService'

import * as types from '../constants/ActionTypes'

// Extract songs from collection state
export const getSongs = (state: any): Array<string> => {
  return state ? state.collection.visibleSongs : []
}

export const getQueue = (state: any): any => {
  return state ? state.queue : {}
}

// Handling playAll saga
export function* playAll(action: any): any {
  const songs = yield select(getSongs)
  yield put({type: types.ADD_SONGS_TO_QUEUE, songs: songs})
  if (songs.length) {
    yield put({type: types.SET_CURRENT_PLAYING, songId: songs[0].id})
    yield put({type: types.START_PLAYING})
  }
}

const adapter = getAdapter()
const queueService = new QueueService(new adapter())

export function* saveQueue(): any {
  const queue = yield select(getQueue)
  yield call(queueService.save, 'queue', queue)
}

// Application initialization routines
function* initialize() {
  yield queueService.initialize
  const queue = yield call(queueService.get)
  if (!queue) {
    yield put({type: types.GET_QUEUE_REJECTED})
  } else {
    const unserialized = JSON.parse(JSON.stringify(queue))
    yield put({type: types.RECEIVE_QUEUE, queue: unserialized})
  }
}

// Binding actions to sagas
function* queueSaga(): any {
  yield takeLatest(types.PLAY_ALL, playAll)
  yield takeLatest(types.ADD_SONGS_TO_QUEUE, saveQueue)
  yield takeLatest(types.INITIALIZED, initialize)
}

export default queueSaga
