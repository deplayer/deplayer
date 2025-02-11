import { describe, it, vi, beforeEach, afterEach } from "vitest";
import { expectSaga } from "redux-saga-test-plan";
import { push } from "redux-first-history";
import { call, select } from "redux-saga/effects";

import { search, createSearchService } from "./index";
import * as types from "../../constants/ActionTypes";
import { getSettings } from "../selectors";
import { SearchService } from "../../services/SearchService";

// Mock the search service module
vi.mock("../../services/SearchService", () => ({
  SearchService: vi.fn(),
}));

describe("search saga", () => {
  const mockResults = [{ id: 1, title: "Test Track" }];
  let mockSearchService: any;

  beforeEach(() => {
    mockSearchService = {
      searchAll: vi.fn().mockResolvedValue(mockResults),
    };
    (SearchService as any).mockImplementation(() => mockSearchService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("performs search and redirects", () => {
    const searchTerm = "test";
    const mockSettings = { providers: { itunes: true } };

    return expectSaga(search, { type: types.START_SEARCH, searchTerm })
      .provide([
        [select(getSettings), mockSettings],
        [
          call(
            mockSearchService.searchAll.bind(mockSearchService),
            searchTerm,
            {
              noRedirect: undefined,
              providers: mockSettings.providers,
            }
          ),
          mockResults,
        ],
      ])
      .put({ type: types.SET_SEARCH_RESULTS, searchResults: mockResults })
      .put(push("/search-results"))
      .put({ type: types.SEARCH_FINISHED, searchTerm })
      .run();
  });

  it("skips redirect when noRedirect is true", () => {
    const searchTerm = "test";
    const mockSettings = { providers: { itunes: true } };

    return expectSaga(search, {
      type: types.START_SEARCH,
      searchTerm,
      noRedirect: true,
    })
      .provide([
        [select(getSettings), mockSettings],
        [
          call(
            mockSearchService.searchAll.bind(mockSearchService),
            searchTerm,
            {
              noRedirect: true,
              providers: mockSettings.providers,
            }
          ),
          mockResults,
        ],
      ])
      .put({ type: types.SET_SEARCH_RESULTS, searchResults: mockResults })
      .not.put(push("/search-results"))
      .put({ type: types.SEARCH_FINISHED, searchTerm })
      .run();
  });

  it("handles search errors", () => {
    const searchTerm = "test";
    const mockSettings = { providers: { itunes: true } };
    const error = new Error("Search failed");

    mockSearchService.searchAll.mockRejectedValue(error);

    return expectSaga(search, { type: types.START_SEARCH, searchTerm })
      .provide([[select(getSettings), mockSettings]])
      .put({ type: types.SEARCH_REJECTED, message: error.message })
      .put({
        type: types.SEND_NOTIFICATION,
        notification: "notifications.search.failed",
      })
      .run();
  });
});
