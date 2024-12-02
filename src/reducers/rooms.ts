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

export default (state: State = defaultState, action: any = {}) => {
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

    case types.REMOVE_ROOM:
      return {
        ...state,
        rooms: state.rooms.filter((room) => room.id !== action.room),
      };

    default:
      return state;
  }
};
