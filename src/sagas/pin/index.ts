import {
  call,
  takeEvery,
  select,
  put
} from 'redux-saga/effects'
import { remove, writeFile } from '@happy-js/happy-opfs'
import axios from 'axios'

import { getCollection } from '../selectors'
import * as types from '../../constants/ActionTypes'
import Media from '../../entities/Media'

import { getAdapter } from '../../services/database'
import CollectionService from '../../services/CollectionService'

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
  console.log('Storing song data', songFsUri, song)
  const streamUrl = song.stream[0].uris[0].uri

  if (!streamUrl) {
    console.error('No stream url found for song', song)
    return
  }

  const streamData = await axios.get(streamUrl, { responseType: 'blob' })
  await writeFile(songFsUri, streamData.data)
  // const fileContents = await readTextFile(songFsUri)
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
  const collectionService = new CollectionService(new adapter())

  const collection = yield select(getCollection)
  const song = collection.rows[action.songId]
  yield call(storeSongData, song)
  // FIXME: Review duplicated streams
  const modifiedSong = {
    ...song,
    stream: [
      ...song.stream,
      { 
        service: 'opfs', 
        uris: [
          {uri: `opfs:///${song.id}`}
        ] 
      }
    ]
  }
  yield call(collectionService.save, modifiedSong.id, modifiedSong)
  yield put({ type: types.ADD_TO_COLLECTION, data: [modifiedSong] })
  yield put({ type: types.RECEIVE_COLLECTION, data: [modifiedSong] })
  yield put({ type: types.SEND_NOTIFICATION, notification: `Song ${modifiedSong.title} pinned` })
}

function* unpinSong(action: PinAction): any {
  const adapter = getAdapter()
  const collectionService = new CollectionService(new adapter())

  const collection = yield select(getCollection)
  const song = collection.rows[action.songId]
  yield call(removeSongData, song)
  const streams = song.stream.filter((s: any) => s.service !== 'opfs')
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
