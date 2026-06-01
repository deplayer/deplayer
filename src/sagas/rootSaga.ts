import { all } from "redux-saga/effects";
import { Store } from "redux";

import artistSaga from "./artist";
import collectionSaga from "./collection";
import connectionSaga from "./connection";
import mediaSessionSaga from "./mediaSession";
import wakeLock from "./wakeLock";
import notificationsSaga from "./notifications";
import playerSaga from "./player";
import searchSaga from "./search";
import titleSaga from "./title";
import roomSaga from "./peer/roomSaga";

function* rootSaga(store: Store) {
  yield all([
    artistSaga(),
    collectionSaga(),
    connectionSaga(store),
    mediaSessionSaga(store),
    wakeLock(store),
    notificationsSaga(store),
    playerSaga(),
    searchSaga(),
    titleSaga(),
    roomSaga(store),
  ]);
}

export default rootSaga;
