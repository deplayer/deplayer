import { takeEvery, put, call, select } from "redux-saga/effects";
import { joinRoom } from "trystero/nostr";
import * as types from "../../constants/ActionTypes";
import PeerService from "../../services/PeerService";
import { Store } from "redux";

interface JoinRoomAction {
  type: typeof types.JOIN_ROOM_REQUESTED;
  payload: { roomCode: string; username: string; config: { appId: string } };
}

function* handleJoinRoom(
  store: Store,
  action: JoinRoomAction
): Generator<any, void, any> {
  const { roomCode, username, config } = action.payload;

  try {
    const room = yield call(joinRoom, config, roomCode);
    const peerService = PeerService.getInstance(store.dispatch, store.getState().collection);

    console.log("About to setup communication channels...");
    try {
      yield call(peerService.setupCommunicationChannels.bind(peerService), room, roomCode);
    } catch (setupError: unknown) {
      console.error("Setup communication channels failed:", setupError);
      throw setupError;
    }
    console.log("Joined room", roomCode);

    yield put({
      type: types.SEND_NOTIFICATION,
      notification: `Joined room #${roomCode}`,
      level: "success",
      duration: 1000,
    });

    yield put({
      type: types.JOIN_ROOM_SUCCESS,
      payload: { roomCode, username },
    });
  } catch (error: unknown) {
    yield put({
      type: types.JOIN_ROOM_FAILED,
      error: true,
      payload: error instanceof Error ? error.message : String(error),
    });
  }
}

interface LeaveRoomAction {
  type: string;
  payload: { roomCode: string };
}

function* handleLeaveRoom(action: LeaveRoomAction): Generator<any, void, any> {
  const { roomCode } = action.payload;

  try {
    const roomState = yield select((state: { rooms: Map<string, { room: { leave: () => void } }> }) => state.rooms.get(roomCode));
    if (roomState) {
      yield call((roomState as { room: { leave: () => void } }).room.leave);
      yield put({ type: types.REMOVE_ROOM, room: roomCode });
      yield put({ type: types.RESET_PEER_STATUS, roomCode });
    }
    yield put({ type: types.LEAVE_ROOM_SUCCESS });
  } catch (error: unknown) {
    yield put({
      type: types.LEAVE_ROOM_FAILED,
      error: true,
      payload: error instanceof Error ? error.message : String(error),
    });
  }
}

export default function* roomSaga(store: Store) {
  yield takeEvery(types.JOIN_ROOM_REQUESTED, handleJoinRoom, store);
  yield takeEvery(types.LEAVE_ROOM_REQUESTED, handleLeaveRoom);
}
