import { takeLatest, select, fork } from 'redux-saga/effects'
import { getState } from './../selectors'
import CacheService from '../../services/cache/CacheService'
import { getAdapter } from '../../services/database'

function* storeCache() {
  const adapter = getAdapter()
  const cacheService = new CacheService(new adapter())
  const state = yield select(getState)
  yield fork(cacheService.save, 'cache', {state: state})
}

// Binding actions to sagas
function* cacheSaga(): any {
  // yield takeLatest('*', storeCache)
}

export default cacheSaga
