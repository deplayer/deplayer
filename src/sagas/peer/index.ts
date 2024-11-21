import { takeLatest, put, select, call, takeEvery } from "redux-saga/effects";
import { v4 as uuidv4 } from "uuid";
import { DataPayload } from "trystero";
import PeerService from "../../services/PeerService";
import PeerStorageService from "../../services/PeerStorageService";
import { getAdapter } from "../../services/database";
import { getCurrentSong } from "../selectors";
import * as types from "../../constants/ActionTypes";
import { Store } from "redux";
import { selfId } from "trystero/nostr";

const adapter = getAdapter();
const peerStorageService = new PeerStorageService(adapter);

function* initializePeers(store: any): any {
  yield call(peerStorageService.initialize);
  const peers = yield call(peerStorageService.get);

  if (peers && peers.length > 0) {
    for (const peer of peers) {
      yield call(joinRoom, store, {
        roomCode: peer.roomCode,
        username: peer.username,
      });
    }
  }
}

function* joinRoom(store: Store, action: any): any {
  const collection = yield select((state) => state.collection);
  const peerService = PeerService.getInstance(store.dispatch);
  peerService.collection = collection;

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
        username: action.username,
      });
    }

    // Send notification of successful join
    yield put({
      type: types.SEND_NOTIFICATION,
      notification: `Joined room ${action.roomCode}`,
      level: "success",
      duration: 1000,
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

function* updatePeerStatus(store: Store): any {
  const collection = yield select((state) => state.collection);
  const peerService = PeerService.getInstance(store.dispatch);
  peerService.collection = collection;
  const currentSong = yield select(getCurrentSong);
  const player = yield select((state) => state.player);

  if (!currentSong) return;

  const { stream, ...songWithoutStreams } = currentSong;

  try {
    const status = {
      peerId: selfId,
      isPlaying: player.playing,
      username: localStorage.getItem("username") || "Anonymous",
      media: songWithoutStreams,
    } as DataPayload;

    // Only try to update status if we have a valid peerId
    yield call([peerService, "updateStatus"], status);
  } catch (error) {
    console.error("Error updating peer status:", error);
    // Optionally dispatch an error notification
  }
}

function* leaveRoom(store: Store): any {
  const collection = yield select((state) => state.collection);
  const peerService = PeerService.getInstance(store.dispatch);
  peerService.collection = collection;
  yield call([peerService, "leaveRoom"]);
  yield put({ type: types.SET_CURRENT_ROOM, roomCode: undefined });
}

// Listen for player state changes to update peer status
function* watchPlayerChanges(store: Store): any {
  yield takeLatest(
    (action: any) =>
      [
        types.START_PLAYING,
        types.TOGGLE_PLAYING,
        types.SET_CURRENT_PLAYING,
        types.PLAY_NEXT,
        types.PLAY_PREV,
        types.PAUSE_PLAYING,
        types.SET_CURRENT_PLAYING_URL,
      ].includes(action.type),
    updatePeerStatus,
    store
  );
}

function* requestStream(store: Store, action: any): any {
  const collection = yield select((state) => state.collection);
  const peerService = PeerService.getInstance(store.dispatch);
  peerService.collection = collection;
  yield call(peerService.requestStream, action.peerId, action.media);
}

// Binding actions to sagas
function* peerSaga(store: Store): Generator {
  yield call(initializePeers, store);
  yield takeEvery(types.JOIN_PEER_ROOM, joinRoom, store);
  yield takeEvery(types.LEAVE_PEER_ROOM, leaveRoom, store);
  yield takeLatest(types.REQUEST_STREAM, requestStream, store);
  yield takeLatest(types.SET_CURRENT_PLAYING_STREAMS, updatePeerStatus, store);
  yield call(watchPlayerChanges, store);
}

export default peerSaga;
