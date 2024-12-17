import { takeLatest, put, select, call, takeEvery } from "redux-saga/effects";
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
        type: types.JOIN_PEER_ROOM,
        roomCode: room.id,
        username,
      });
    }
  }

  yield put({ type: types.APP_READY });
}

interface JoinRoomAction {
  type: typeof types.JOIN_PEER_ROOM;
  roomCode: string;
  username: string;
}

function* joinRoom(store: Store, action: JoinRoomAction): any {
  const collection = yield select((state) => state.collection);
  const peerService = PeerService.getInstance(store.dispatch, collection);

  try {
    // Save room first
    yield call(roomStorageService.save, action.roomCode);

    // Then handle peer joining
    yield call(
      peerService!.joinWithCode.bind(peerService),
      action.roomCode,
      action.username
    );

    const peerId = `${action.username}-${action.roomCode}`;

    // Save peer to database
    yield call(peerStorageService.save, peerId, {
      roomCode: action.roomCode,
      username: action.username,
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

function* reportCurrentPlaying(store: Store): any {
  const collection = yield select((state) => state.collection);
  const peerService = PeerService.getInstance(store.dispatch, collection);
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
      yield put({
        type: types.NOTIFY_CURRENT_PLAYING_TO_ROOM,
        payload: {
          status,
          roomCode,
        },
      });
    }
  } catch (error) {
    console.error("Error updating peer status:", error);
    // Optionally dispatch an error notification
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
    reportCurrentPlaying,
    store
  );
}

interface RequestSongFileAction {
  type: typeof types.REQUEST_SONG_FILE;
  peerId: string;
  media: IMedia;
  roomCode: string;
}

function* requestSongFile(store: Store, action: RequestSongFileAction): any {
  const collection = yield select((state) => state.collection);
  const peerService = PeerService.getInstance(store.dispatch, collection);

  console.log("Requesting song file", action)
  yield call(peerService.requestSongFile.bind(peerService), action.peerId, action.media, action.roomCode)
}

interface RequestRealtimeStreamAction {
  type: typeof types.REQUEST_REALTIME_STREAM;
  peerId: string;
  roomCode: string;
  media: IMedia;
}

function* requestRealtimeStream(
  store: Store,
  action: RequestRealtimeStreamAction
): any {
  const collection = yield select((state) => state.collection);
  const peerService = PeerService.getInstance(store.dispatch, collection);

  yield call(peerService.sendRealtimeStream.bind(peerService), action.roomCode, action.media);
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
  yield call(roomStorageService.remove, action.room);
}

function* notifyCurrentPlayingToRoom(store: Store, action: any): any {
  const collection = yield select((state) => state.collection);
  const peerService = PeerService.getInstance(store.dispatch, collection);
  const roomState = peerService.rooms.get(action.payload.roomCode);

  if (!roomState) return;

  yield call(
    roomState.notifyCurrentPlayingToRoom.bind(roomState),
    { ...action.payload.status, roomCode: action.payload.roomCode }
  );
}

// Binding actions to sagas
function* peerSaga(store: Store): Generator {
  yield call(initializePeers, store);
  yield takeLatest(types.REQUEST_REALTIME_STREAM, requestRealtimeStream, store);
  yield takeEvery(types.JOIN_PEER_ROOM, joinRoom, store);
  // yield takeEvery(types.PEER_LEFT, updatePeerStatus, store);
  // yield takeEvery(types.PEER_JOINED, updatePeerStatus, store);
  yield takeLatest(types.REMOVE_ROOM, removeRoom, store);
  yield takeLatest(types.REQUEST_SONG_FILE, requestSongFile, store);
  yield takeLatest(
    types.NOTIFY_CURRENT_PLAYING_TO_ROOM,
    notifyCurrentPlayingToRoom,
    store
  );
  // yield takeLatest(types.SET_CURRENT_PLAYING_STREAMS, updatePeerStatus, store);
  yield call(watchPlayerChanges, store);
}

export default peerSaga;
