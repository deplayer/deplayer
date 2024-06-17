import { put, call } from "redux-saga/effects";

import { getAdapter } from "../../services/database";
import { magnetToMedia } from "../../services/Webtorrent";
import CollectionService from "../../services/CollectionService";
import * as types from "../../constants/ActionTypes";

export function* readWebtorrentFile(action: any): Generator<any, void, any> {
  console.log("getting media objects from magnet: ", action.magnet);
  const medias = yield call(magnetToMedia, action.magnet);
  const adapter = getAdapter();
  const collectionService = new CollectionService(new adapter());

  console.log("medias: ", medias);

  // Save song
  for (let i = 0; i < medias.length; i++) {
    const media = medias[i].toDocument();
    yield call(collectionService.save, media.id, media);
  }
  yield put({ type: types.RECEIVE_COLLECTION, data: medias });
  yield put({
    type: types.SEND_NOTIFICATION,
    notification: `adding webtorrent ${action.magnet}`,
  });
}
