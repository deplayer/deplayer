import { takeLatest, put, select, call, takeEvery } from "redux-saga/effects";
import { v4 as uuidv4 } from 'uuid';

import PeerService from "../../services/PeerService";
import PeerStorageService from "../../services/PeerStorageService";
import { getAdapter } from "../../services/database";
import { getCurrentSong } from "../selectors";
import * as types from "../../constants/ActionTypes";
import { Dispatch } from "redux";

const adapter = getAdapter();
const peerStorageService = new PeerStorageService(adapter);

function* initializePeers(store: any): any {
  yield call(peerStorageService.initialize);
  const peers = yield call(peerStorageService.get);
  
  if (peers && peers.length > 0) {
    for (const peer of peers) {
      yield call(joinRoom, store.dispatch, { 
        roomCode: peer.roomCode,
        username: peer.username
      });
    }
  }
}

function* joinRoom(dispatch: Dispatch, action: any): any {
  console.log("joinRoom", action);

  const peerService = new PeerService(dispatch);

  try {
    // Check if peer already exists
    const existingPeer = yield call(
      peerStorageService.findByRoomAndUsername.bind(peerStorageService),
      action.roomCode,
      action.username
    );

    // Only join room if peer doesn't exist
    yield call(
      peerService!.joinWithCode.bind(peerService),
      action.roomCode,
      action.username
    );
    yield put({ type: types.SET_CURRENT_ROOM, roomCode: action.roomCode });

    // Save peer to database only if it doesn't exist
    if (!existingPeer) {
      yield call(peerStorageService.save, uuidv4(), {
        roomCode: action.roomCode,
        username: action.username
      });
    }

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

function* updatePeerStatus(dispatch: Dispatch): any {
  const peerService = new PeerService(dispatch);
  const currentSong = yield select(getCurrentSong);
  const player = yield select((state) => state.player);

  if (!currentSong) return;

  const status = {
    currentSong: currentSong.title,
    isPlaying: player.playing,
    peerId: peerService.getPeerId(),
    username: localStorage.getItem("username") || "Anonymous",
    currentMedia: {
      id: currentSong.id,
      title: currentSong.title,
      artist: currentSong.artistName,
      thumbnailUrl: currentSong.cover?.thumbnailUrl
    }
  };

  yield call([peerService, "updateStatus"], status);
}

function* shareStream(dispatch: Dispatch): any {
  const peerService = new PeerService(dispatch);
  const currentSong = yield select(getCurrentSong);
  const { streamUri } = yield select((state) => state.player);

  if (currentSong && streamUri) {
    yield call(
      [peerService, "shareStream"], 
      streamUri, 
      currentSong.id,
      currentSong
    );
  }
}

function* leaveRoom(dispatch: Dispatch): any {
  const peerService = new PeerService(dispatch);
  yield call([peerService, 'leaveRoom']);
  yield put({ type: types.SET_CURRENT_ROOM, roomCode: undefined });
}

// Listen for player state changes to update peer status
function* watchPlayerChanges(dispatch: Dispatch): any {
  yield takeLatest(
    (action: any) => [
      types.START_PLAYING,
      types.TOGGLE_PLAYING,
      types.SET_CURRENT_PLAYING,
      types.PLAY_NEXT,
      types.PLAY_PREV,
      types.PAUSE_PLAYING,
      types.SET_CURRENT_PLAYING_URL,
    ].includes(action.type),
    updatePeerStatus,
    dispatch
  );
}

// Binding actions to sagas
function* peerSaga(store: any): Generator {
  yield call(initializePeers, store);
  yield takeEvery(types.JOIN_PEER_ROOM, joinRoom, store.dispatch);
  yield takeEvery(types.LEAVE_PEER_ROOM, leaveRoom, store.dispatch);
  yield takeLatest(types.SHARE_STREAM, shareStream, store.dispatch);
  yield takeLatest(types.SET_CURRENT_PLAYING_STREAMS, updatePeerStatus, store.dispatch);
  yield call(watchPlayerChanges, store.dispatch);
}

export default peerSaga;
