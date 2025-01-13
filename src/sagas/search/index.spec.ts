import { describe, it, vi } from "vitest";
import { expectSaga } from "redux-saga-test-plan";
import { call } from "redux-saga/effects";
import { push } from "redux-first-history";

import { search } from "./index";
import * as types from "../../constants/ActionTypes";
import CollectionService from "../../services/CollectionService";
import * as database from "../../services/database";

// Mock the adapter
vi.mock("../../services/database", () => ({
  getAdapter: () => ({
    search: async () => [{ id: "1", title: "London Calling" }],
  }),
}));

describe("search", () => {
  it("works", () => {
    const searchTerm = "The Clash";
    const action = {
      type: types.START_SEARCH,
      searchTerm,
      noRedirect: false,
    };

    const mockResults = [{ id: "1", title: "London Calling" }];

    return expectSaga(search, action)
      .provide({
        call: (effect, next) => {
          // Mock the provider search
          if (effect.fn.name === "bound searchForProvider") {
            return mockResults;
          }
          // Mock the goToSearchResults function
          if (effect.fn.name === "goToSearchResults") {
            return undefined;
          }
          return next();
        },
        select: () => ({
          providers: {}, // No providers to avoid waiting for ADD_TO_COLLECTION
        }),
      })
      .put({ type: types.RECEIVE_COLLECTION, data: mockResults })
      .put({
        type: types.SEARCH_FINISHED,
        searchTerm,
        data: mockResults,
      })
      .put({
        type: types.SEND_NOTIFICATION,
        notification: "notifications.search.finished",
      })
      .run();
  });
});
