import { all, put, takeLatest, select } from 'redux-saga/effects'
import ipfsClient from 'ipfs-http-client'

import  * as types from '../constants/ActionTypes'

const getIpfsSettings = (state: any): any => {
  return state ? state.settings : {}
}

export function* startProvidersScan(): any {
  const settings = yield select(getIpfsSettings)
  const ipfsSettings = settings.settings.providers['ipfs1']
  const ipfs = ipfsClient({
    host: ipfsSettings.host,
    port: ipfsSettings.port,
    protocol: 'http'
  })
  const files = yield ipfs.ls(ipfsSettings.hash)
  yield all(files.map((file: any) => {
    return put({ type: types.LOAD_IPFS_FILE, file: file.path })
  }))
}

// Binding actions to sagas
function* providersSaga(): any {
  yield takeLatest(types.START_SCAN_SOURCES, startProvidersScan)
}

export default providersSaga
