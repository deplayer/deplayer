import { takeLatest, put, select, call } from 'redux-saga/effects'

import { getAdapter } from '../../services/database'
import { getQueue } from '../selectors'
import QueueService from '../../services/QueueService'
import logger from '../../utils/logger'
import * as types from '../../constants/ActionTypes'

import { initialize } from './workers'

// Import IMedia type
import { IMedia } from '../../entities/Media';

// Define interfaces for state and actions
interface CollectionState {
  rows: { [key: string]: IMedia };
  songsByAlbum: { [key: string]: string[] };
}

interface AppState {
  collection: CollectionState;
}

interface AddAlbumToQueueAction {
  type: string;
  albumId: string;
}

// Extract songs from collection state
export const getSongs = (state: any, action: { path: string }): Array<string> => {
  if (!state) return []
  
  logger.log('queue-saga', 'getSongs path:', action.path)
  
  if (action.path === 'search-results') {
    logger.log('queue-saga', 'search results:', state.collection.searchResults)
    return state.collection.searchResults
  }

  if (action.path === 'collection') {
    logger.log('queue-saga', 'filtered songs:', state.collection.filteredSongs)
    return state.collection.filteredSongs
  }

  // Handle different routes
  const pathParts = action.path.split('/')
  if (pathParts[0] === 'albums' && pathParts[1]) {
    logger.log('queue-saga', 'songs by album:', state.collection.songsByAlbum[pathParts[1]])
    return state.collection.songsByAlbum[pathParts[1]] || []
  }
  
  if (pathParts[0] === 'artists' && pathParts[1]) {
    logger.log('queue-saga', 'songs by artist:', state.collection.songsByArtist[pathParts[1]])
    return state.collection.songsByArtist[pathParts[1]] || []
  }
  
  if (pathParts[0] === 'genres' && pathParts[1]) {
    logger.log('queue-saga', 'songs by genre:', state.collection.songsByGenre[pathParts[1]])
    return state.collection.songsByGenre[pathParts[1]] || []
  }

  logger.log('queue-saga', 'fallback to filtered songs:', state.collection.filteredSongs)
  return state.collection.filteredSongs
}

// Get song objects from collection
export const getSongObjects = (state: any, songIds: Array<string>) => {
  return songIds.map(id => state.collection.rows[id]).filter(Boolean)
}

// Handling playAll saga
function* playAll(action: any): any {
  logger.log('queue-saga', 'playAll action:', action)
  const songIds = yield select(getSongs, action)
  logger.log('queue-saga', 'song ids to play:', songIds)

  if (songIds.length) {
    const songs = yield select(getSongObjects, songIds)
    logger.log('queue-saga', 'song objects to play:', songs)
    
    yield put({ type: types.ADD_SONGS_TO_QUEUE, songs, replace: true })
    yield put({ type: types.SET_CURRENT_PLAYING, songId: songIds[0] })
    yield put({ type: types.START_PLAYING })
  }
}

// Handling addToQueueNext saga
export function* addToQueueNext(action: any): any {
  if (!action.songs && action.path) {
    logger.log('queue-saga', 'addToQueueNext action:', action)
    const songIds = yield select(getSongs, action)
    logger.log('queue-saga', 'song ids to add next:', songIds)

    if (songIds.length) {
      const songs = yield select(getSongObjects, songIds)
      logger.log('queue-saga', 'song objects to add next:', songs)
      yield put({ type: types.ADD_TO_QUEUE_NEXT, songs })
    }
  }
}

const adapter = getAdapter()
const queueService = new QueueService(adapter)

function* saveQueue(): any {
  const queue = yield select(getQueue)
  logger.log('queue-saga', 'saving queue', queue)

  yield call(queueService.save, 'queue', {
    trackIds: queue.trackIds,
    randomTrackIds: queue.randomTrackIds,
    currentPlaying: queue.currentPlaying,
    repeat: queue.repeat,
    shuffle: queue.shuffle,
    nextSongId: queue.nextSongId,
    prevSongId: queue.prevSongId
  })
}

function* clearQueue(): any {
  logger.log('queue-saga', 'removing queue')
  yield call(queueService.save, 'queue', {})
}

function* addAlbumToQueue(action: AddAlbumToQueueAction): any {
  const songsByAlbum: { [key: string]: string[] } = yield select((state: AppState) => state.collection.songsByAlbum);
  const collection: { [key: string]: IMedia } = yield select((state: AppState) => state.collection.rows);
  logger.log('queue-saga', songsByAlbum);
  
  // Convert song IDs to song objects
  const songObjects = songsByAlbum[action.albumId]
    .map((songId: string) => collection[songId])
    .filter(Boolean); // Remove any null/undefined entries
    
  yield put({ type: types.ADD_SONGS_TO_QUEUE, songs: songObjects, replace: false });
  yield put({ type: types.SET_CURRENT_PLAYING, songId: songsByAlbum[action.albumId][0] });
  yield put({ type: types.START_PLAYING });
}

// Binding actions to sagas
export default function* queueSaga(): any {
  yield takeLatest(types.INITIALIZED, initialize)
  yield takeLatest(types.ADD_ALBUM_TO_QUEUE, addAlbumToQueue)
  yield takeLatest(types.PLAY_ALL, playAll)
  yield takeLatest(types.ADD_TO_QUEUE_NEXT, addToQueueNext)
  yield takeLatest([
    types.SHUFFLE,
    types.REPEAT,
    types.SET_CURRENT_PLAYING,
    types.ADD_TO_QUEUE,
    types.REMOVE_FROM_QUEUE,
    types.CLEAR_QUEUE
  ], saveQueue)
}
