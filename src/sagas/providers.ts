import {
  all,
  put,
  fork,
  take,
  takeLatest,
  takeEvery,
  select
} from 'redux-saga/effects'
import ipfsClient, { isIPFS } from 'ipfs-http-client'

import  * as types from '../constants/ActionTypes'

const mediaExp = new RegExp(/.*(.mp3|.wav|.avi)$/)

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

  if (!isIPFS.cidPath(hash)) {
    yield put({ type: types.IPFS_NON_SUPPORTED_ITEM, file: hash })
  }

  try {
    const files = yield ipfs.ls(hash)
    yield put({ type: types.IPFS_FOLDER_SCANNED, files })
  } catch (e) {
    yield put({ type: types.IPFS_FOLDER_SCAN_FAILED, error: e })
  }
}

export function* startFolderScan(action: any): any {
  yield fork(scanFolder, action.file.hash)
  const { files } = yield take([types.IPFS_FOLDER_SCANNED])

  yield all(files.map((file: any) => {
    if (file.type === 'dir') {
      return put({ type: types.START_IPFS_FOLDER_SCAN, file })
    }

    console.log(file.name)

    if (mediaExp.test(file.name)) {
      return put({ type: types.LOAD_IPFS_FILE, file })
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
    if (file.type === 'dir') {
      return put({ type: types.START_IPFS_FOLDER_SCAN, file })
    }

    console.log(file.name)

    if (mediaExp.test(file.name)) {
      return put({ type: types.LOAD_IPFS_FILE, file })
    }

    return put({ type: types.IPFS_NON_SUPPORTED_ITEM, file: file.path })
  }))
}

function* loadIPFSFile(action: any): any {
  const settings = yield select(getIpfsSettings)
  const ipfsSettings = settings.settings.providers['ipfs1']

  const ipfs = ipfsClient({
    host: ipfsSettings.host,
    port: ipfsSettings.port,
    protocol: 'http'
  })
  const file = yield ipfs.get(action.file.path)
  const contents = yield file.content.toString('utf8')

  const jsmediatags = (window as any).jsmediatags
  new jsmediatags.Reader(contents)
  .read({
    onSuccess: function(tag) {
      console.log(tag);
    },
    onError: function(error) {
      console.log(':(', error.type, error.info);
    }
  })
}

// Binding actions to sagas
function* providersSaga(): any {
  yield takeEvery(types.START_IPFS_FOLDER_SCAN, startFolderScan)
  yield takeLatest(types.START_SCAN_SOURCES, startProvidersScan)
  yield takeLatest(types.LOAD_IPFS_FILE, loadIPFSFile)
}

export default providersSaga
