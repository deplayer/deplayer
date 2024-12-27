import * as types from "../constants/ActionTypes";

export type Room = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export type State = {
  rooms: Room[];
};

export const defaultState: State = {
  rooms: [],
};

export type JoinPeerRoomAction = {
  type: typeof types.JOIN_PEER_ROOM;
  roomCode: string;
  username: string;
};

export type RemoveRoomAction = {
  type: typeof types.REMOVE_ROOM;
  room: string;
};

export type SetRoomsAction = {
  type: typeof types.SET_ROOMS;
  rooms: Room[];
};

export type AddRoomAction = {
  type: typeof types.ADD_ROOM;
  room: Room;
};

export type JoinRoomSuccessAction = {
  type: typeof types.JOIN_ROOM_SUCCESS;
  payload: {
    roomCode: string;
  };
};

export type Action =
  | JoinPeerRoomAction
  | RemoveRoomAction
  | SetRoomsAction
  | AddRoomAction
  | JoinRoomSuccessAction;

export default (state: State = defaultState, action: Action) => {
  switch (action.type) {
    case types.SET_ROOMS:
      return {
        ...state,
        rooms: action.rooms,
      };

    case types.ADD_ROOM:
      if (state.rooms.some((room) => room.id === action.room.id)) {
        return state;
      }
      return {
        ...state,
        rooms: [
          ...state.rooms,
          {
            ...action.room,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

    case types.JOIN_PEER_ROOM:
      const existingRoomIndex = state.rooms.findIndex(
        (room) => room.id === action.roomCode
      );
      if (existingRoomIndex >= 0) {
        return {
          ...state,
          rooms: state.rooms.map((room, index) =>
            index === existingRoomIndex
              ? { ...room, updatedAt: new Date() }
              : room
          ),
        };
      }
      return {
        ...state,
        rooms: [
          ...state.rooms,
          {
            id: action.roomCode,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

    case types.REMOVE_ROOM:
      return {
        ...state,
        rooms: state.rooms.filter((room) => room.id !== action.room),
      };

    case types.JOIN_ROOM_SUCCESS:
      if (state.rooms.some((room) => room.id === action.payload.roomCode)) {
        return state;
      }
      return {
        ...state,
        rooms: [
          ...state.rooms,
          {
            id: action.payload.roomCode,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

    default:
      return state;
  }
};
