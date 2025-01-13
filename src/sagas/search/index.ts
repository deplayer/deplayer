import {
  call,
  put,
  takeLatest,
  select,
  all,
  fork,
  take,
} from "redux-saga/effects";

import { push } from "redux-first-history";
import * as types from "../../constants/ActionTypes";
import ProvidersService from "../../services/ProvidersService";
import { getSettings } from "./../selectors";
import { getAdapter } from "../../services/database";
import CollectionService from "../../services/CollectionService";

const adapter = getAdapter();
const collectionService = new CollectionService(adapter);

// Going to search results page
export function* goToSearchResults(): any {
  yield put(push("/search-results"));
}

// Handle every provider as independent thread
function* performSingleSearch(
  searchTerm: string,
  provider: string
): Generator<any, void, any> {
  try {
    const settings = yield select(getSettings);
    const providerService = new ProvidersService(settings);
    const searchResults = yield call(
      providerService.searchForProvider,
      searchTerm,
      provider
    );

    // First add to collection
    yield put({ type: types.ADD_TO_COLLECTION, data: searchResults });

    // After collection is updated, get all matching results from PostgreSQL
    const results = yield call(collectionService.search, searchTerm);

    // Update search results with all matching media
    yield put({ type: types.SET_SEARCH_RESULTS, searchResults: results });
  } catch (e: any) {
    console.log(e);

    yield put({ type: types.SEARCH_REJECTED, message: e.message });
    yield put({
      type: types.SEND_NOTIFICATION,
      notification: "notifications.search.failed",
    });
  }
}

function* emptySearch() {
  yield put({ type: types.ADD_TO_COLLECTION, data: [] });
}

type SearchAction = {
  type: string;
  searchTerm: string;
  noRedirect?: boolean;
};

// Handling search saga
export function* search(action: SearchAction): any {
  const settings = yield select(getSettings);
  const providersService = new ProvidersService(settings);
  const redirect = !action.noRedirect;
  const hasProviders = Object.keys(providersService.providers).length;

  // First perform local search and show results immediately
  const localResults = yield call(collectionService.search, action.searchTerm);
  yield put({ type: types.SET_SEARCH_RESULTS, searchResults: localResults });

  // Redirect early to show local results
  if (redirect) {
    yield call(goToSearchResults);
  }

  // Then search in providers if any
  if (hasProviders) {
    const searchPromises = Object.keys(providersService.providers).map(
      (provider) => {
        return fork(performSingleSearch, action.searchTerm, provider);
      }
    );
    yield all(searchPromises);
    yield take([types.ADD_TO_COLLECTION, types.SEARCH_REJECTED]);
  }

  yield put({
    type: types.SEARCH_FINISHED,
    searchTerm: action.searchTerm,
    data: localResults,
  });
  yield put({
    type: types.SEND_NOTIFICATION,
    notification: "notifications.search.finished",
  });
}

// Binding actions to sagas
function* searchSaga(): any {
  yield takeLatest(types.START_SEARCH, search);
}

export default searchSaga;
