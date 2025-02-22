import { takeLatest, call, put } from "redux-saga/effects";
import { getAdapter } from "../services/database";
import * as types from "../constants/ActionTypes";
import { createLogger } from "../utils/logger";
import { favorites } from "../schema";
import { InferModel } from "drizzle-orm";

const adapter = getAdapter();
const logger = createLogger({ namespace: "favorites-saga" });

type Favorite = InferModel<typeof favorites>;

// Application initialization routines
export function* initialize(): Generator<any, void, any> {
  try {
    logger.debug("Initializing favorites...");
    const db = yield call(adapter.getDb);
    
    // Get all favorites from the database
    const favorites = yield call(async () => {
      return await db.query.favorites.findMany();
    });

    if (favorites && favorites.length > 0) {
      // Extract media IDs from favorites
      const favoriteIds = favorites.map((favorite: Favorite) => favorite.mediaId);
      yield put({ type: types.LOAD_FAVORITES_SUCCESS, favoriteIds });
    } else {
      // No favorites found, initialize with empty array
      yield put({ type: types.LOAD_FAVORITES_SUCCESS, favoriteIds: [] });
    }
  } catch (error: any) {
    logger.error("Failed to load favorites:", error);
    yield put({ type: types.LOAD_FAVORITES_ERROR, error: error.message });
  }
}

// Binding actions to sagas
export default function* favoritesSaga(): any {
  yield takeLatest(types.INITIALIZED, initialize);
} 