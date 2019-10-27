import {
  call,
  put,
  takeLatest,
  select,
  all,
  fork
} from 'redux-saga/effects'

import history from '../store/configureHistory'

import  * as types from '../constants/ActionTypes'
import ProvidersService from '../services/ProvidersService'
import { getSettings } from './selectors'

// Handle every provider as independent thread
function* performSingleSearch(
  searchTerm: string,
  provider: string
) {
  try {
    const settings = yield select(getSettings)
    const providerService = new ProvidersService(settings)
    const searchResults = yield call(providerService.searchForProvider, searchTerm, provider)
    yield put({type: types.ADD_TO_COLLECTION, data: searchResults})
  } catch (e) {
    yield put({type: types.SEARCH_REJECTED, message: e.message})
    yield put({type: types.SEND_NOTIFICATION, notification: 'notifications.search.failed'})
  }
}

type SearchAction = {
  type: string,
  searchTerm: string,
  noRedirect?: boolean
}

// Handling search saga
export function* search(action: SearchAction): any {
  const settings = yield select(getSettings)
  const providersService = new ProvidersService(settings)
  const redirect = !action.noRedirect

  const searchPromises = Object.keys(providersService.providers).map((provider) => {
    return fork(performSingleSearch, action.searchTerm, provider)
  })
  yield all(searchPromises)
  yield put({type: types.SEARCH_FINISHED, searchTerm: action.searchTerm})
  yield put({type: types.SEND_NOTIFICATION, notification: 'notifications.search.finished'})

  if (redirect) {
    yield call(goToSearchResults)
  }
}

// Going to home page
export function* goToSearchResults(): any {
  yield history.push('/search-results')
}

// Binding actions to sagas
function* searchSaga(): any {
  yield takeLatest(types.START_SEARCH, search)
}

export default searchSaga
