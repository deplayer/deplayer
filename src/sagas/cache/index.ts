import { takeLatest, select, fork } from 'redux-saga/effects'
import { getAdapter } from '../../services/database'

function* invalidateCache() {
  // const cacheService = new invalidateReduxie('')
  // yield fork(cacheService.save, 'cache', {state: state})
}

// Binding actions to sagas
function* cacheSaga(): any {
  // yield takeLatest(types.INVALIDATE_CACHE, invalidateCache)
}

export default cacheSaga
