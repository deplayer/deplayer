import { takeLatest } from 'redux-saga/effects'
import ipfsClient from 'ipfs-http-client'
import logger from '../utils/logger'

import  * as types from '../constants/ActionTypes'

export function* startProvidersScan(): any {
  const ipfs = ipfsClient('localhost', '5001', { protocol: 'http' })
  const files = yield ipfs.ls('QmacAfVrN2g5ArUmneqbQLkzTfdhNCLP1iraDaQJd6dULk')
  logger.log(files)
}

// Binding actions to sagas
function* providersSaga(): any {
  yield takeLatest(types.START_SCAN_SOURCES, startProvidersScan)
}

export default providersSaga
