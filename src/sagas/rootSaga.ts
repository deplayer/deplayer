import { all } from "redux-saga/effects";

import artistSaga from "./artist";
import collectionSaga from "./collection";
import connectionSaga from "./connection";
import mediaSessionSaga from "./mediaSession";
import wakeLock from "./wakeLock";
import notificationsSaga from "./notifications";
import playerSaga from "./player";
import providersSaga from "./providers";
import searchSaga from "./search";
import titleSaga from "./title";
import webtorrentSaga from "./webtorrent";
import pinSaga from "./pin";
import peerSaga from "./peer";
import roomSaga from "./peer/roomSaga";

function* rootSaga(store: any) {
  yield all([
    artistSaga(),
    collectionSaga(),
    connectionSaga(store),
    mediaSessionSaga(store),
    wakeLock(store),
    notificationsSaga(store),
    playerSaga(),
    providersSaga(),
    searchSaga(),
    pinSaga(),
    titleSaga(),
    webtorrentSaga(),
    peerSaga(store),
    roomSaga(store),
  ]);
}

export default rootSaga;
