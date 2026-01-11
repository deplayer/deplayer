import {
  call,
  put,
  takeLatest,
} from "redux-saga/effects";

import { push } from "redux-first-history";
import * as types from "../../constants/ActionTypes";
import ProvidersService from "../../services/ProvidersService";
import { getSettingsFromLiveStore } from "./../selectors";
import { getAdapter } from "../../services/database";
import CollectionService from "../../services/CollectionService";
import { SearchService } from "../../services/SearchService";
import logger from "../../utils/logger";

const adapter = getAdapter();
const collectionService = new CollectionService(adapter);

// Create search service instance
const createSearchService = (settings: any) => {
  const providersService = new ProvidersService(settings);
  return new SearchService(collectionService, providersService);
};

// Going to search results page
function* goToSearchResults(): any {
  yield put(push("/search-results"));
}

type SearchAction = {
  type: string;
  searchTerm: string;
  noRedirect?: boolean;
};

// Handling search saga
export function* search(action: SearchAction): any {
  try {
    const settings = yield call(getSettingsFromLiveStore);
    const searchService = createSearchService(settings);

    // Perform search
    const searchResults = yield call([searchService, searchService.searchAll], action.searchTerm);

    // If we have provider results, dispatch them to update the collection state
    if (searchResults && searchResults.length > 0) {
      yield put({ type: types.RECEIVE_COLLECTION, data: searchResults });
    }

    // Update search results
    yield put({ type: types.SET_SEARCH_RESULTS, searchResults });

    // Redirect if needed
    if (!action.noRedirect) {
      yield call(goToSearchResults);
    }

    yield put({
      type: types.SEARCH_FINISHED,
      searchTerm: action.searchTerm,
      data: searchResults
    });
  } catch (error: any) {
    logger.error("Search saga error:", error);
    yield put({ type: types.SEARCH_REJECTED, message: error.message });
    yield put({
      type: types.SEND_NOTIFICATION,
      notification: "notifications.search.failed",
    });
  }
}

// Binding actions to sagas
function* searchSaga(): any {
  yield takeLatest(types.START_SEARCH, search);
}

export default searchSaga;
