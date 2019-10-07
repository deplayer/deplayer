import {
  actionChannel,
  call,
  put,
  fork,
  take,
  takeLatest,
  select
} from 'redux-saga/effects'

import { getAdapter } from '../services/database';
import { getFileMetadata, metadataToSong } from '../services/ID3Tag/ID3TagService'
import { scanFolder } from '../services/Ipfs/IpfsService'
import CollectionService from '../services/CollectionService';
import  * as types from '../constants/ActionTypes'

const getIpfsSettings = (state: any): any => {
  return state ? state.settings : {}
}

export function* startFolderScan(hash: string): any {
  const settings = yield select(getIpfsSettings)

  try {
    const files = yield call(scanFolder, hash, settings)

    return files
  } catch(e) {
    yield put({ type: types.IPFS_FOLDER_SCAN_FAILED, e })

    return e
  }
}

// Watcher should enque tasks to avoid concurrency
export function* startProvidersScan(): any {
  const settings = yield select(getIpfsSettings)
  const providerKey = 'ipfs0'
  const ipfsSettings = settings.settings.providers[providerKey]
  yield put({ type: 'PROVIDER_SCAN_STARTED', providerKey })

  // Dispatching an event with configured ipfs hash
  yield put({type: types.IPFS_FOLDER_FOUND, hash: ipfsSettings.hash })
  yield put({ type: 'PROVIDER_SCAN_FINISHED',  providerKey })
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
      const settings = yield select(getIpfsSettings)
      const metadata = yield call(getFileMetadata, file, settings)
      console.log('song metadata: ', metadata)

      const song = yield call(metadataToSong, metadata, file)

      const adapter = getAdapter()
      const collectionService = new CollectionService(new adapter())

      // Save song
      console.log('saving song: ', song)
      yield call(collectionService.save, song.id, song.toDocument())

      yield put({ type: types.IPFS_SONG_SAVED, song })
      yield put({
        type: types.SEND_NOTIFICATION,
        notification: song.title + ' - ' + song.artistName + ' saved',
        level: 'warning'
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

// Binding actions to sagas
function* providersSaga(): any {
  yield takeLatest(types.START_SCAN_SOURCES, startProvidersScan)
  yield fork(handleIPFSFolderScan)
  yield fork(handleIPFSFileLoad)
}

export default providersSaga
