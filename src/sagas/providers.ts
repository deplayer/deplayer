import { all, put, fork, take, takeLatest, select } from 'redux-saga/effects'
import ipfsClient from 'ipfs-http-client'

import  * as types from '../constants/ActionTypes'

const mediaExp = new RegExp(".*\.(mp3|wav|avi)$")

const getIpfsSettings = (state: any): any => {
  return state ? state.settings : {}
}

export function* scanFolder(hash: string) {
  const settings = yield select(getIpfsSettings)
  const ipfsSettings = settings.settings.providers['ipfs1']
  const ipfs = ipfsClient({
    host: ipfsSettings.host,
    port: ipfsSettings.port,
    protocol: 'http'
  })
  try {
    const files = yield ipfs.ls(hash)
    yield put({ type: types.IPFS_FOLDER_SCANNED, files })
  } catch {
    yield put({ type: types.IPFS_FOLDER_SCAN_FAILED })
  }
}

export function* startFolderScan(action: any): any {
  yield fork(scanFolder, action.hash)
  const { files } = yield take([types.IPFS_FOLDER_SCANNED])

  yield all(files.map((file: any) => {
    if (file.type === 'dir') {
      return put({ type: types.START_IPFS_FOLDER_SCAN, hash: file })
    }

    if (file.path.match(mediaExp)) {
      return put({ type: types.LOAD_IPFS_FILE, file: file.path })
    }

    return put({ type: types.IPFS_NON_SUPPORTED_ITEM, file: file.path })
  }))
}

export function* startProvidersScan(): any {
  const settings = yield select(getIpfsSettings)
  const ipfsSettings = settings.settings.providers['ipfs1']

  yield fork(scanFolder, ipfsSettings.hash)
  const { files } = yield take([types.IPFS_FOLDER_SCANNED])

  yield all(files.map((file: any) => {
    if (file.path.match(mediaExp)) {
      return put({ type: types.LOAD_IPFS_FILE, file: file.path })
    } else {
      return put({ type: types.START_IPFS_FOLDER_SCAN, hash: file })
    }
  }))
}

// Binding actions to sagas
function* providersSaga(): any {
  yield takeLatest(types.START_IPFS_FOLDER_SCAN, startFolderScan)
  yield takeLatest(types.START_SCAN_SOURCES, startProvidersScan)
}

export default providersSaga
