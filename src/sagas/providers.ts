import {
  actionChannel,
  call,
  put,
  fork,
  take,
  takeLatest,
  select
} from 'redux-saga/effects'

import { loadIPFSFile, scanFolder, getFileMetadata } from '../services/Ipfs/IpfsService'
import  * as types from '../constants/ActionTypes'

const getIpfsSettings = (state: any): any => {
  return state ? state.settings : {}
}

// FIXME: This method should run in serial
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
  const ipfsSettings = settings.settings.providers['ipfs1']

  // Dispatching an event with configured ipfs hash
  yield put({type: types.IPFS_FOLDER_FOUND, hash: ipfsSettings.hash })
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
      // const contents = yield call(loadIPFSFile, file, settings)
      // console.log('contents: ', contents)
      const metadata = yield call(getFileMetadata, file, settings)
      console.log('metadata: ', metadata)
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
