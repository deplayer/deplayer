import {
  actionChannel,
  call,
  put,
  fork,
  take,
  takeLatest,
  takeEvery,
  select
} from 'redux-saga/effects'

import { getAdapter } from '../services/database'
import { getFileMetadata, metadataToSong } from '../services/ID3Tag/ID3TagService'
import { getSettings } from './selectors'
import { scanFolder } from '../services/Ipfs/IpfsService'
import YoutubeDlServerProvider from '../providers/YoutubeDlServerProvider'
import CollectionService from '../services/CollectionService'
import  * as types from '../constants/ActionTypes'

export function* startFolderScan(hash: string): any {
  const settings = yield select(getSettings)

  try {
    const files = yield call(scanFolder, hash, settings)

    return files
  } catch(e) {
    yield put({ type: types.IPFS_FOLDER_SCAN_FAILED, e })

    yield put({
      type: types.SEND_NOTIFICATION,
      notification: `failed scanning: ${ hash }`,
      level: 'warning'
    })

    return e
  }
}

// Watcher should enque tasks to avoid concurrency
export function* startProvidersScan(): any {
  const settings = yield select(getSettings)

  const providerKeys = Object.keys(settings.providers).filter((key: string) => {
    return key.match(/ipfs|youtube-dl-server/)
  })

  for (let key of providerKeys) {
    if (key.match(/youtube-dl-server/)) {
      yield put({ type: 'START_YOUTUBE_DL_SERVER_SCAN', data: settings.providers[key], key })
    }

    if (key.match(/ipfs/)) {
      const ipfsSettings = settings.providers[key]
      yield put({ type: 'PROVIDER_SCAN_STARTED', key })

      const { hash } = ipfsSettings

      yield put({
        type: types.SEND_NOTIFICATION,
        notification: `starting to scan hash: ${ hash }`,
        level: 'info'
      })

      // Dispatching an event with configured ipfs hash
      yield put({type: types.IPFS_FOLDER_FOUND, hash })
      yield put({ type: 'PROVIDER_SCAN_FINISHED',  key })
    }
  }
}

// IPFS file scan Queue
// Watcher
function* handleIPFSFileLoad(): any {
  const handleChannel = yield actionChannel(types.IPFS_FILE_FOUND)

  while (true) {
    // 2- take from the channel
    const { file } = yield take(handleChannel)
    // 3- Note that we're using a blocking call
    try {
      const settings = yield select(getSettings)
      const metadata = yield call(getFileMetadata, file, settings)
      console.log('song metadata: ', metadata)

      const song = yield call(metadataToSong, metadata, file)

      const adapter = getAdapter()
      const collectionService = new CollectionService(new adapter())

      // Save song
      yield call(collectionService.save, song.id, song.toDocument())

      yield put({ type: types.IPFS_SONG_SAVED, song })
      yield put({
        type: types.SEND_NOTIFICATION,
        notification: song.title + ' - ' + song.artistName + ' saved',
        level: 'info'
      })
    } catch(e) {
      yield put({ type: types.IPFS_NON_SUPPORTED_ITEM, e })
    }
  }
}

// IPFS Folder scan Queue
// Watcher
function* handleIPFSFolderScan(): any {
  const handleChannel = yield actionChannel(types.IPFS_FOLDER_FOUND)

  while (true) {
    // 2- take from the channel
    const { hash } = yield take(handleChannel)
    // 3- Note that we're using a blocking call
    const files = yield call(startFolderScan, hash)

    for (let file of files) {
      if (file.type === 'dir') {
        // Recursive execution
        yield put({ type: types.IPFS_FOLDER_FOUND, hash: file.hash })
      } else {
        yield put({ type: types.IPFS_FILE_FOUND, file })
      }
    }
  }
}

function* startYoutubeDlScan(action: any) {
  const settings = yield select(getSettings)
  const service = new YoutubeDlServerProvider(
    settings.app['youtube-dl-server'],
    action.key
  )

  const result = yield service.search(action.data.url)
  yield put({type: types.ADD_TO_COLLECTION, data: result})
}

// Binding actions to sagas
function* providersSaga(): any {
  yield takeLatest(types.START_SCAN_SOURCES, startProvidersScan)
  yield takeEvery('START_YOUTUBE_DL_SERVER_SCAN', startYoutubeDlScan)
  yield fork(handleIPFSFolderScan)
  yield fork(handleIPFSFileLoad)
}

export default providersSaga
