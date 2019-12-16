// Binding actions to sagas
import { takeLatest } from 'redux-saga/effects'
import * as types from '../../constants/ActionTypes'
import { readWebtorrentFile, } from './workers'

function* webtorrentSaga(): any {
  yield takeLatest(types.ADD_WEBTORRENT_MEDIA, readWebtorrentFile)
}

export default webtorrentSaga
