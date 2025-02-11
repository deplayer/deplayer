import { describe, it } from "vitest";
import { expectSaga } from "redux-saga-test-plan";
import * as matchers from "redux-saga-test-plan/matchers";
import { channel } from "redux-saga";

import { addToCollectionWatcher } from "./watchers";
import * as types from "../../constants/ActionTypes";
import { saveToDbWorker } from "./workers";

describe("addToCollectionWatcher", () => {
  it("works", () => {
    const mockChannel = channel();

    return expectSaga(addToCollectionWatcher)
      .withState({ collection: { rows: {} } })
      .provide([
        [matchers.actionChannel(types.ADD_TO_COLLECTION), mockChannel],
        [
          matchers.take(mockChannel),
          { type: types.ADD_TO_COLLECTION, data: [] },
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
      .dispatch({ type: types.ADD_TO_COLLECTION, data: [] })
      .put({ type: types.RECEIVE_COLLECTION_FINISHED })
      .silentRun(100);
  });
});
