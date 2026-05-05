import { describe, it, afterEach, vi } from "vitest";
import { expectSaga } from "redux-saga-test-plan";

import {
  deleteCollectionWorker,
  exportCollectionWorker,
  importCollectionWorker,
  removeFromDbWorker,
  saveToDbWorker,
} from "./workers";
import * as types from "../../constants/ActionTypes";

// Mock getLiveStoreInstance to return a fake store in tests
vi.mock("../../App", () => ({
  getLiveStoreInstance: vi.fn(() => ({
    // Minimal mock — workers call LiveStore actions via `call` effect,
    // which redux-saga-test-plan doesn't actually execute by default
  })),
}));

// Mock LiveStore actions so `call` effects resolve without error
vi.mock("../../stores/livestore/actions/media", () => ({
  addMediaBulkAction: vi.fn(),
  removeMediaAction: vi.fn(),
  trackMediaPlayedAction: vi.fn(),
}));

describe("collection workers", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("saveToDbWorker", () => {
    it("works", () => {
      const data: any[] = [];
      return expectSaga(saveToDbWorker, data)
        .put({ type: types.SAVE_COLLECTION_FULLFILLED })
        .run(100);
    });
  });

  describe("removeFromDbWorker", () => {
    it("works", () => {
      const action = { type: 'REMOVE_FROM_COLLECTION', data: [] as string[] };
      return expectSaga(removeFromDbWorker, action)
        .put({ type: types.REMOVE_FROM_COLLECTION_FULFILLED, data: [] })
        .run(100);
    });
  });

  describe("deleteCollectionWorker", () => {
    it("works", () => {
      return expectSaga(deleteCollectionWorker)
        .put({ type: types.REMOVE_FROM_COLLECTION_FULFILLED })
        .put({ type: types.CLEAR_COLLECTION })
        .put({ type: types.CLEAR_QUEUE })
        .put({
          type: types.SEND_NOTIFICATION,
          notification: "notifications.collection_deleted",
        })
        .run(100);
    });
  });

  describe("exportCollectionWorker", () => {
    it("dispatches rejection since export is temporarily unavailable", () => {
      return expectSaga(exportCollectionWorker)
        .put({
          type: types.EXPORT_COLLECTION_REJECTED,
          message: "Export collection is temporarily unavailable",
        })
        .run(100);
    });
  });

  describe("importCollectionWorker", () => {
    it("dispatches finished with error since import is temporarily unavailable", () => {
      return expectSaga(importCollectionWorker, {
        type: "TO_BE_FIXED",
        data: {},
      })
        .put({
          type: types.IMPORT_COLLECTION_FINISHED,
          result: { error: "Import collection is temporarily unavailable" },
        })
        .run(100);
    });
  });
});
