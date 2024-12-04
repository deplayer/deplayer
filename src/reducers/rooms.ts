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

export type Action = JoinPeerRoomAction | RemoveRoomAction | SetRoomsAction | AddRoomAction

export default (state: State = defaultState, action: Action) => {
  switch (action.type) {
    case types.SET_ROOMS:
      return {
        ...state,
        rooms: action.rooms,
      };

    case types.ADD_ROOM:
      return {
        ...state,
        rooms: [...state.rooms, {
          ...action.room,
          createdAt: new Date(),
          updatedAt: new Date()
        }],
      };

    case types.JOIN_PEER_ROOM:
      return {
        ...state,
        rooms: [...state.rooms, action.roomCode],
      };

    case types.REMOVE_ROOM:
      return {
        ...state,
        rooms: state.rooms.filter((room) => room.id !== action.room),
      };

    default:
      return state;
  }
};
