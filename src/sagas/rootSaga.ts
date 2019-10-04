import { all } from 'redux-saga/effects'

import artistSaga from './artist'
import collectionSaga from './collection'
import connectionSaga from './connection'
import databaseSyncSaga from './databaseSync'
import mediaSessionSaga from './mediaSession'
import notificationsSaga from './notifications'
import playerSaga from './player'
import playlistSaga from './playlist'
import providersSaga from './providers'
import queueSaga from './queue'
import searchSaga from './search'
import settingsSaga from './settings'
import titleSaga from './title'

function* rootSaga(store: any) {
  yield all([
    artistSaga(),
    collectionSaga(),
    connectionSaga(store),
    databaseSyncSaga(),
    // mediaSessionSaga(store),
    notificationsSaga(store),
    playerSaga(),
    playlistSaga(),
    providersSaga(),
    queueSaga(),
    searchSaga(),
    settingsSaga(),
    titleSaga()
  ])
}

export default rootSaga
