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
import { IMedia } from "../../entities/Media";

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

  // Dispatch app ready after peer initialization
  yield put({ type: types.APP_READY });
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
      roomCode: yield select((state) => state.currentRoom),
      isPlaying: player.playing,
      username: localStorage.getItem("username") || "Anonymous",
      media: songWithoutStreams,
    } as DataPayload;

    for (const roomCode of peerService.getRooms()) {
      // Only try to update status if we have a valid peerId
      yield call(peerService.updateStatus.bind(peerService), status, roomCode);
    }
  } catch (error) {
    console.error("Error updating peer status:", error);
    // Optionally dispatch an error notification
  }
}

interface LeaveRoomAction {
  type: typeof types.LEAVE_PEER_ROOM;
  roomCode: string;
}

function* leaveRoom(store: Store, action: LeaveRoomAction): any {
  try {
    const collection = yield select((state) => state.collection);
    const peerService = PeerService.getInstance(store.dispatch);
    peerService.collection = collection;

    // Leave the room in peer service
    yield call(peerService.leaveRoom.bind(peerService), action.roomCode);

    // Remove from database and wait for completion
    yield call(
      peerStorageService.removeByRoom.bind(peerStorageService),
      action.roomCode
    );

    // Send notification
    yield put({
      type: types.SEND_NOTIFICATION,
      notification: `Left room ${action.roomCode}`,
      level: "success",
      duration: 1000,
    });
  } catch (error) {
    console.error("Error leaving room:", error);
    yield put({
      type: types.SEND_NOTIFICATION,
      notification: "Failed to leave room",
      level: "error",
      duration: 1000,
    });
  }
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

interface RequestStreamAction {
  type: typeof types.REQUEST_STREAM;
  peerId: string;
  media: IMedia;
  roomCode: string;
}

function* requestStream(store: Store, action: RequestStreamAction): any {
  const collection = yield select((state) => state.collection);
  const peerService = PeerService.getInstance(store.dispatch);
  peerService.collection = collection;

  yield call(
    peerService.requestStream.bind(peerService),
    action.peerId,
    action.media,
    action.roomCode
  );
}

function* requestRealtimeStream(
  store: Store,
  action: RequestStreamAction
): any {
  const collection = yield select((state) => state.collection);
  const peerService = PeerService.getInstance(store.dispatch);
  peerService.collection = collection;

  yield call(
    peerService.sendRealtimeStream.bind(peerService),
    action.roomCode
  );
}

// Binding actions to sagas
function* peerSaga(store: Store): Generator {
  yield call(initializePeers, store);
  yield takeLatest(types.REQUEST_REALTIME_STREAM, requestRealtimeStream, store);
  yield takeEvery(types.JOIN_PEER_ROOM, joinRoom, store);
  yield takeEvery(types.LEAVE_PEER_ROOM, leaveRoom, store);
  yield takeLatest(types.REQUEST_STREAM, requestStream, store);
  yield takeLatest(types.SET_CURRENT_PLAYING_STREAMS, updatePeerStatus, store);
  yield call(watchPlayerChanges, store);
}

export default peerSaga;
