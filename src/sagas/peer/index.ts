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
import RoomStorageService from "../../services/RoomStorageService";

const adapter = getAdapter();
const peerStorageService = new PeerStorageService(adapter);
const roomStorageService = new RoomStorageService(adapter);

function* initializePeers(store: any): any {
  yield call(roomStorageService.initialize);
  yield call(peerStorageService.initialize);
  
  // Get rooms from storage
  const rooms = yield call(roomStorageService.get);
  if (rooms && rooms.length > 0) {
    yield put({ type: types.SET_ROOMS, rooms });
    
    // Join each room
    for (const room of rooms) {
      const username = localStorage.getItem("username") || "Anonymous";
      yield call(joinRoom, store, {
        roomCode: room.id,
        username,
      });
    }
  }

  yield put({ type: types.APP_READY });
}

function* joinRoom(store: Store, action: any): any {
  const collection = yield select((state) => state.collection);
  const peerService = PeerService.getInstance(store.dispatch);
  peerService.collection = collection;

  try {
    // Save room first
    yield call(roomStorageService.save, action.roomCode);
    
    // Then handle peer joining
    yield call(
      peerService!.joinWithCode.bind(peerService),
      action.roomCode,
      action.username
    );

    // Save peer to database
    yield call(peerStorageService.save, uuidv4(), {
      roomCode: action.roomCode,
      username: action.username,
    });

    yield put({
      type: types.SEND_NOTIFICATION,
      notification: `Joined room ${action.roomCode}`,
      level: "success",
      duration: 1000,
    });
  } catch (error) {
    console.error("Error joining room:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
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

    // Remove room from storage
    yield call(roomStorageService.remove, action.roomCode);

    // Remove associated peers
    yield call(
      peerStorageService.removeByRoom.bind(peerStorageService),
      action.roomCode
    );

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

interface RemoveRoomAction {
  type: typeof types.REMOVE_ROOM;
  room: string;
}

function* removeRoom(_store: Store, action: RemoveRoomAction): any {
  yield call(
    peerStorageService.removeByRoom.bind(peerStorageService),
    action.room
  );
}

// Binding actions to sagas
function* peerSaga(store: Store): Generator {
  yield call(initializePeers, store);
  yield takeLatest(types.REQUEST_REALTIME_STREAM, requestRealtimeStream, store);
  yield takeEvery(types.JOIN_PEER_ROOM, joinRoom, store);
  yield takeEvery(types.PEER_LEFT, updatePeerStatus, store);
  yield takeEvery(types.PEER_JOINED, updatePeerStatus, store);
  yield takeEvery(types.LEAVE_PEER_ROOM, leaveRoom, store);
  yield takeLatest(types.REMOVE_ROOM, removeRoom, store);
  yield takeLatest(types.REQUEST_STREAM, requestStream, store);
  yield takeLatest(types.SET_CURRENT_PLAYING_STREAMS, updatePeerStatus, store);
  yield call(watchPlayerChanges, store);
}

export default peerSaga;
