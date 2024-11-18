import { takeLatest, put, select, call } from "redux-saga/effects";

import PeerService from "../../services/PeerService";
import { getCurrentSong } from "../selectors";
import * as types from "../../constants/ActionTypes";
import { Dispatch } from "redux";

function* joinRoom(dispatch: Dispatch, action: { roomCode: string; username: string }): any {
  console.log("joinRoom", action);

  const peerService = new PeerService(dispatch);

  try {
    yield call(
      peerService!.joinWithCode.bind(peerService),
      action.roomCode,
      action.username
    );
    yield put({ type: types.SET_CURRENT_ROOM, roomCode: action.roomCode });

    // Send notification of successful join
    yield put({
      type: types.SEND_NOTIFICATION,
      notification: `Joined room ${action.roomCode}`,
      level: "success",
    });
  } catch (error) {
    console.error("Error joining room:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    yield put({
      type: types.SEND_NOTIFICATION,
      notification: `Failed to join room: ${errorMessage}`,
      level: "error",
    });
    yield put({ type: types.PEER_ERROR, error });
  }
}

function* updatePeerStatus(action: any): any {
  const peerService = new PeerService(action.dispatch);

  const currentSong = yield select(getCurrentSong);
  const player = yield select((state) => state.player);

  yield call([peerService, "updateStatus"], {
    currentSong: currentSong?.title,
    isPlaying: player.playing,
    peerId: peerService.getPeerId(),
    username: localStorage.getItem("username") || "Anonymous",
  });
}

function* shareStream(action: any): any {
  const peerService = new PeerService(action.dispatch);

  const currentSong = yield select(getCurrentSong);
  const { streamUri } = yield select((state) => state.player);

  if (currentSong && streamUri) {
    yield call([peerService, "shareStream"], streamUri, currentSong.id);
  }
}

// Listen for player state changes to update peer status
function* watchPlayerChanges(): any {
  yield takeLatest(
    [
      types.START_PLAYING,
      types.TOGGLE_PLAYING,
      types.SET_CURRENT_PLAYING,
      types.PLAY_NEXT,
      types.PLAY_PREV,
    ],
    updatePeerStatus
  );
}

// Binding actions to sagas
function* peerSaga(store: any): Generator {
  yield takeLatest(types.JOIN_PEER_ROOM, joinRoom, store.dispatch);
  yield takeLatest(types.SHARE_STREAM, shareStream, store.dispatch);
  yield call(watchPlayerChanges);
}

export default peerSaga;
