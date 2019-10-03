import {
  actionChannel,
  all,
  call,
  put,
  fork,
  take,
  takeLatest,
  select
} from 'redux-saga/effects'
import ipfsClient, { isIPFS } from 'ipfs-http-client'

import  * as types from '../constants/ActionTypes'

const mediaExp = new RegExp(/.*(.mp3|.wav|.avi)$/)

const getIpfsSettings = (state: any): any => {
  return state ? state.settings : {}
}

export const scanFolder = async (hash: string, settings: any) => {
  console.log('scanning folder')
  const ipfsSettings = settings.settings.providers['ipfs1']
  const ipfs = ipfsClient({
    host: ipfsSettings.host,
    port: ipfsSettings.port,
    protocol: 'http'
  })

  const files = await ipfs.ls(hash)
  return files
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

// FIXME: This method should run in serial
function* loadIPFSFile(file: any): any {
  console.log(file.path)
  if (!mediaExp.test(file.path)) {
    return yield put({ type: types.IPFS_NON_SUPPORTED_ITEM, file: file.path })
  }

    // return put({ type: types.IPFS_NON_SUPPORTED_ITEM, file: file.path })
  const settings = yield select(getIpfsSettings)
  const ipfsSettings = settings.settings.providers['ipfs1']

  const ipfs = ipfsClient({
    host: ipfsSettings.host,
    port: ipfsSettings.port,
    protocol: 'http'
  })
  const fileContent = yield ipfs.get(file.path)
  const contents = yield fileContent.content.toString('utf8')
}

// IPFS file scan Queue
// Watcher
function* handleIPFSFileLoad(): any {
  console.log('starting handleIPFSFileLoad')
  const handleChannel = yield actionChannel(types.LOAD_IPFS_FILE)

  while (true) {
    // 2- take from the channel
    const { file } = yield take(handleChannel)
    // 3- Note that we're using a blocking call
    yield call(loadIPFSFile, file)
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
