import {
  actionChannel,
  call,
  put,
  fork,
  take,
  takeLatest,
  select
} from 'redux-saga/effects'

import { loadIPFSFile, scanFolder } from '../services/Ipfs/IpfsService'
import  * as types from '../constants/ActionTypes'

const getIpfsSettings = (state: any): any => {
  return state ? state.settings : {}
}

// FIXME: This method should run in serial
export function* startFolderScan(hash: string): any {
  const settings = yield select(getIpfsSettings)
  const files = yield call(scanFolder, hash, settings)

  if (!files) {
    yield put({ type: 'NO FILES RETRIEVED' })
  }

  for (let file of files) {
    if (file.type === 'dir') {
      // Recursive execution
      yield put({ type: types.IPFS_FOLDER_FOUND, folder: file })
    } else {
      yield put({ type: types.IPFS_FILE_FOUND, file })
    }
  }
}

// Watcher
export function* startProvidersScan(): any {
  const settings = yield select(getIpfsSettings)
  const ipfsSettings = settings.settings.providers['ipfs1']

  yield fork(handleIPFSFolderScan)
  yield put({type: types.START_IPFS_FOLDER_SCAN, hash: ipfsSettings.hash })
}

// IPFS file scan Queue
// Watcher
function* handleIPFSFileLoad(): any {
  console.log('starting handleIPFSFileLoad')
  const handleChannel = yield actionChannel(types.LOAD_IPFS_FILE)
  //
  // return put({ type: types.IPFS_NON_SUPPORTED_ITEM, file: file.path })
  const settings = yield select(getIpfsSettings)
  const ipfsSettings = settings.settings.providers['ipfs1']

  while (true) {
    // 2- take from the channel
    const { file } = yield take(handleChannel)
    // 3- Note that we're using a blocking call
    yield call(loadIPFSFile, file, ipfsSettings)
  }
}

// IPFS Folder scan Queue
// Watcher
function* handleIPFSFolderScan(): any {
  const handleChannel = yield actionChannel(types.START_IPFS_FOLDER_SCAN)

  while (true) {
    // 2- take from the channel
    const { hash } = yield take(handleChannel)
    // 3- Note that we're using a blocking call
    const file = yield fork(startFolderScan, hash)
    const action = yield take([types.IPFS_FOLDER_FOUND])

    console.log(action)
  }
}

// Binding actions to sagas
function* providersSaga(): any {
  yield takeLatest(types.START_SCAN_SOURCES, startProvidersScan)
}

export default providersSaga
