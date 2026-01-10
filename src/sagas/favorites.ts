import { takeLatest } from "redux-saga/effects";
import * as types from "../constants/ActionTypes";
import { createLogger } from "../utils/logger";

const logger = createLogger({ namespace: "favorites-saga" });

/**
 * Favorites Saga - LEGACY
 * 
 * This saga is now deprecated. Favorites are managed by LiveStore.
 * Kept for backwards compatibility during migration.
 * 
 * All favorite operations now use:
 * - LiveStore hooks: useIsFavorite(), useFavorites(), useFavoriteIds()
 * - LiveStore actions: toggleFavoriteAction(), addFavoriteAction(), removeFavoriteAction()
 */

// Application initialization routines
function* initialize(): Generator<any, void, any> {
  logger.info("Favorites saga is now legacy - using LiveStore for favorites");
  // No-op: Favorites are now loaded reactively from LiveStore via hooks
}

// Binding actions to sagas
export default function* favoritesSaga(): any {
  yield takeLatest(types.INITIALIZED, initialize);
} 