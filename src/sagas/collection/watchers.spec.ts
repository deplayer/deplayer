import { describe, it, beforeEach, afterEach, vi } from "vitest";
import { expectSaga } from "redux-saga-test-plan";
import * as matchers from "redux-saga-test-plan/matchers";
import { channel, Channel } from "redux-saga";

import { addToCollectionWatcher } from "./watchers";
import * as types from "../../constants/ActionTypes";
import { saveToDbWorker } from "./workers";
import type { MediaRow } from "../../types/media";

// Mock database adapter
vi.mock("../../services/database", () => ({
  getAdapter: vi.fn(() => ({
    bulkSave: vi.fn(),
    initialize: vi.fn(),
  })),
}));

// Mock collection service
vi.mock("../../services/CollectionService", () => ({
  default: vi.fn().mockImplementation(() => ({
    bulkSave: vi.fn().mockResolvedValue(undefined),
    initialize: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe("addToCollectionWatcher", () => {
  let mockChannel: Channel<any>;

  beforeEach(() => {
    mockChannel = channel();
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockChannel.close();
  });

  it("handles collection updates correctly", () => {
    const testData: MediaRow[] = [];

    expectSaga(addToCollectionWatcher)
      .withState({ collection: { rows: {} } })
      .provide([
        [matchers.actionChannel(types.ADD_TO_COLLECTION), mockChannel],
        [
          matchers.take(mockChannel),
          { type: types.ADD_TO_COLLECTION, data: testData },
        ],
        [matchers.fork.fn(saveToDbWorker), undefined],
        [
          matchers.take([
            types.SAVE_COLLECTION_FULLFILLED,
            types.SAVE_COLLECTION_FAILED,
          ]),
          { type: types.SAVE_COLLECTION_FULLFILLED },
        ],
      ])
      .dispatch({ type: types.ADD_TO_COLLECTION, data: testData })
      .put({ type: types.RECEIVE_COLLECTION_FINISHED })
  });
});
