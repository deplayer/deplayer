import {
  call,
  takeEvery,
  select,
  put
} from 'redux-saga/effects'
import { remove, writeFile } from '@happy-js/happy-opfs'

import { getCollection } from '../selectors'
import * as types from '../../constants/ActionTypes'
import Media from '../../entities/Media'

import { getAdapter } from '../../services/database'
import CollectionService from '../../services/CollectionService'
import { MediaFileService } from '../../services/MediaFileService'

type PinAction = {
  type: string,
  songId: string,
}

type PinAlbumAction = {
  type: string,
  albumId: string,
}

async function removeSongData(song: Media) {
  const songFsUri = `/${song.id}`
  console.log('Removing song data', songFsUri)
  await remove(songFsUri)
}

async function storeSongData(song: Media) {
  const songMedia = new Media(song)
  if (songMedia.hasAnyProviderOf(['opfs'])) {
    return
  }

  const songFsUri = `/${song.id}`
  const mediaFile = await MediaFileService.getMediaFile(songMedia)
  
  if (!mediaFile) {
    console.error('Could not get media file for song', song)
    return
  }

  await writeFile(songFsUri, mediaFile)
}

function* pinAlbum(action: PinAlbumAction): any {
  const collection = yield select(getCollection)
  const albumSongIds = collection.songsByAlbum[action.albumId]
  for (const songId of albumSongIds) {
    yield put({ type: types.PIN_SONG, songId })
  }
}

function* unpinAlbum(action: PinAlbumAction): any {
  const collection = yield select(getCollection)
  const albumSongIds = collection.songsByAlbum[action.albumId]
  for (const songId of albumSongIds) {
    yield put({ type: types.UNPIN_SONG, songId })
  }
}

function* pinSong(action: PinAction): any {
  const adapter = getAdapter()
  const collectionService = new CollectionService(adapter)

  const collection = yield select(getCollection)
  const song = collection.rows[action.songId]
  yield call(storeSongData, song)
  // FIXME: Review duplicated streams
  const modifiedSong = {
    ...song,
    stream: {
      ...song.stream,
      opfs: {
        service: 'opfs',
        uris: [
          { uri: `opfs:///${song.id}` }
        ]
      }
    }
  }
  yield call(collectionService.save, modifiedSong.id, modifiedSong)
  yield put({ type: types.ADD_TO_COLLECTION, data: [modifiedSong] })
  yield put({ type: types.RECEIVE_COLLECTION, data: [modifiedSong] })
  yield put({ type: types.SEND_NOTIFICATION, notification: `Song ${modifiedSong.title} pinned` })
}

function* unpinSong(action: PinAction): any {
  const adapter = getAdapter()
  const collectionService = new CollectionService(adapter)

  const collection = yield select(getCollection)
  const song = collection.rows[action.songId]
  yield call(removeSongData, song)
  const streams = delete song.stream
  // FIXME: Review duplicated streams
  const modifiedSong = {
    ...song,
    stream: streams
  }
  yield call(collectionService.save, modifiedSong.id, modifiedSong)
  yield put({ type: types.ADD_TO_COLLECTION, data: [modifiedSong] })
  yield put({ type: types.RECEIVE_COLLECTION, data: [modifiedSong] })
  yield put({ type: types.SEND_NOTIFICATION, notification: 'notifications.songUnpinned' })
}


// Binding actions to sagas
function* pinSaga(): any {
  yield takeEvery(types.PIN_SONG, pinSong)
  yield takeEvery(types.UNPIN_SONG, unpinSong)
  yield takeEvery(types.PIN_ALBUM, pinAlbum)
  yield takeEvery(types.UNPIN_ALBUM, unpinAlbum)
}

export default pinSaga
