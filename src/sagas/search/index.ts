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
import logger from "../../utils/logger";

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
    logger.debug("Starting search for provider:", { searchTerm, provider });
    
    const settings = yield select(getSettings);
    const providerService = new ProvidersService(settings);
    
    logger.debug("Searching in provider service");
    const searchResults = yield call(
      providerService.searchForProvider,
      searchTerm,
      provider
    );
    logger.debug("Provider search results:", searchResults);

    // First add to collection
    yield put({ type: types.ADD_TO_COLLECTION, data: searchResults });
    yield put({ type: types.RECEIVE_COLLECTION, data: searchResults });

    logger.debug("Starting collection search");
    // After collection is updated, get all matching results from PostgreSQL
    const results = yield call(collectionService.search, searchTerm);
    logger.debug("Collection search results:", results);

    // Update search results with all matching media
    yield put({ type: types.SET_SEARCH_RESULTS, searchResults: results });
  } catch (err: any) {
    logger.error("Error in performSingleSearch:", err);
    logger.debug("Search error details:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
      searchTerm,
      provider
    });

    yield put({ type: types.SEARCH_REJECTED, message: err.message });
    yield put({
      type: types.SEND_NOTIFICATION,
      notification: "notifications.search.failed",
    });
  }
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

  // First perform local search and show results immediately
  const newResults = yield call(collectionService.search, action.searchTerm);
  yield put({ type: types.SET_SEARCH_RESULTS, searchResults: newResults });

  yield put({
    type: types.SEARCH_FINISHED,
    searchTerm: action.searchTerm,
  });
}

// Binding actions to sagas
function* searchSaga(): any {
  yield takeLatest(types.START_SEARCH, search);
}

export default searchSaga;
