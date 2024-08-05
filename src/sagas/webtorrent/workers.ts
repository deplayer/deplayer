import { put, call } from "redux-saga/effects";

import { getAdapter } from "../../services/database";
import { magnetToMedia } from "../../services/Webtorrent";
import CollectionService from "../../services/CollectionService";
import * as types from "../../constants/ActionTypes";
import Media from "../../entities/Media"

export function* readWebtorrentFile(action: any): Generator<any, void, any> {
  console.log("getting media objects from magnet: ", action.magnet);
  const medias = yield call(magnetToMedia, action.magnet);
  const adapter = getAdapter();
  const collectionService = new CollectionService(new adapter());

  console.log("medias: ", medias);

  const mediasDocs = medias.map((media: Media) => media.toDocument());

  // Save song
  for (let i = 0; i < mediasDocs.length; i++) {
    const med = mediasDocs[i];
    yield call(collectionService.save, med.id, med);
  }
  yield put({ type: types.RECEIVE_COLLECTION, data: mediasDocs });
  yield put({
    type: types.SEND_NOTIFICATION,
    notification: `adding webtorrent ${action.magnet}`,
  });
}
