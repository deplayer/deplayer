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
      const action = { data: [] };
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
    it("works", () => {
      return expectSaga(exportCollectionWorker)
        .put({ type: types.EXPORT_COLLECTION_FINISHED, exported: {} })
        .run(100);
    });
  });

  describe("importCollectionWorker", () => {
    it("works", () => {
      return expectSaga(importCollectionWorker, {
        type: "TO_BE_FIXED",
        data: {},
      })
        .put({ type: types.IMPORT_COLLECTION_FINISHED, result: {} })
        .run(100);
    });
  });
});
