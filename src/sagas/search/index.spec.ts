import { describe, it, vi } from "vitest";
import { expectSaga } from "redux-saga-test-plan";
import { call } from "redux-saga/effects";
import { push } from "redux-first-history";

import { search } from "./index";
import * as types from "../../constants/ActionTypes";
import CollectionService from "../../services/CollectionService";
import { getAdapter } from "../../services/database";

// Mock the adapter
vi.mock("../../services/database", () => ({
  getAdapter: () => ({
    search: async () => [{ id: "1", title: "London Calling" }],
  }),
}));

// Mock the providers service
vi.mock("../../services/ProvidersService", () => ({
  default: vi.fn().mockImplementation(() => ({
    providers: { itunes: { enabled: true } },
    searchForProvider: vi
      .fn()
      .mockResolvedValue([{ id: "2", title: "Rock the Casbah" }]),
  })),
}));

const adapter = getAdapter();
const collectionService = new CollectionService(adapter);

describe("search", () => {
  it("shows local results immediately and updates with remote results", () => {
    const searchTerm = "The Clash";
    const action = {
      type: types.START_SEARCH,
      searchTerm,
      noRedirect: false,
    };

    const mockLocalResults = [{ id: "1", title: "London Calling" }];
    const mockRemoteResults = [{ id: "2", title: "Rock the Casbah" }];

    return expectSaga(search, action)
      .provide([
        [call(collectionService.search, searchTerm), mockLocalResults],
        {
          select: () => ({
            providers: {
              itunes: { enabled: true },
            },
          }),
        },
      ])
      // First show local results
      .put({
        type: types.SET_SEARCH_RESULTS,
        searchResults: mockLocalResults,
      })
      // Then redirect to search results page
      .put(push("/search-results"))
      // Then add remote results to collection
      .put({ type: types.RECEIVE_COLLECTION, data: mockRemoteResults })
      // Update search results with remote results
      .put({
        type: types.SET_SEARCH_RESULTS,
        searchResults: mockLocalResults,
      })
      // Finally mark search as finished
      .put({
        type: types.SEARCH_FINISHED,
        searchTerm,
      })
      .put({
        type: types.SEND_NOTIFICATION,
        notification: "notifications.search.finished",
      })
      .silentRun();
  });
});
