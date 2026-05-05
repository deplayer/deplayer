import {
  call,
  put,
  takeLatest,
  all,
  fork,
} from "redux-saga/effects";

import { push } from "redux-first-history";
import * as types from "../../constants/ActionTypes";
import ProvidersService from "../../services/ProvidersService";
import { getSettingsFromLiveStore } from "../selectors";
import { getLiveStoreInstance } from "../../App";
import { batchedMediaCommitter } from "../../stores/livestore/services/BatchedMediaCommitter";
import { NormalizedMedia } from "../../utils/normalizeMedia";

// Going to search results page
export function* goToSearchResults(): Generator<any, void, any> {
  yield put(push("/search-results"));
}

// Handle every provider as independent thread
// Uses BatchedMediaCommitter to throttle commits and reduce UI refreshes
function* performSingleProviderSearch(
  searchTerm: string,
  provider: string
): Generator<any, void, any> {
  try {
    const settings = yield call(getSettingsFromLiveStore);
    const providerService = new ProvidersService(settings);
    
    const searchResults: NormalizedMedia[] = yield call(
      providerService.searchForProvider,
      searchTerm,
      provider
    );

    if (searchResults && searchResults.length > 0) {
      // Get LiveStore instance and initialize batched committer
      const liveStore = getLiveStoreInstance();
      if (liveStore) {
        // Set store on committer (idempotent)
        batchedMediaCommitter.setStore(liveStore);
        
        // Add to batched committer - will be committed after throttle window
        // This reduces UI refreshes: 5 providers = 1-2 commits instead of 5
        yield call([batchedMediaCommitter, 'add'], searchResults);
      }
    }
  } catch (e: unknown) {
    console.error(`[Search Saga] Error searching provider ${provider}:`, e);
    yield put({ type: types.SEARCH_REJECTED, message: e instanceof Error ? e.message : String(e) });
  }
}

type SearchAction = {
  type: string;
  searchTerm: string;
  searchType?: string;
  noRedirect?: boolean;
};

// Handling search saga
export function* search(action: SearchAction): Generator<any, void, any> {
  const searchTerm = action.searchTerm;
  const redirect = !action.noRedirect;

  // Get settings from LiveStore
  const settings = yield call(getSettingsFromLiveStore);
  if (!settings?.providers) {
    yield put({ type: types.SEARCH_FINISHED, searchTerm });
    return;
  }

  const providersService = new ProvidersService(settings);
  const enabledProviders = Object.keys(providersService.providers);

  // Redirect to search results page to show local results immediately
  // (LiveStore hooks will handle displaying local matches)
  if (redirect) {
    yield call(goToSearchResults);
  }

  // Then search in providers if any
  if (enabledProviders.length > 0) {
    // Fork all provider searches in parallel
    const searchTasks = enabledProviders.map((provider) => {
      return fork(performSingleProviderSearch, searchTerm, provider);
    });
    
    yield all(searchTasks);
  }

  yield put({
    type: types.SEARCH_FINISHED,
    searchTerm,
  });
  
  yield put({
    type: types.SEND_NOTIFICATION,
    notification: "notifications.search.finished",
  });
}

// Binding actions to sagas
function* searchSaga(): Generator<any, void, any> {
  yield takeLatest(types.START_SEARCH, search);
}

export default searchSaga;
