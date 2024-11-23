import * as types from "../constants/ActionTypes";

export type State = {
  rooms: string[];
};

export const defaultState = {
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
        rooms: [...state.rooms, action.room],
      };

    case types.REMOVE_ROOM:
      return {
        ...state,
        rooms: state.rooms.filter((room) => room !== action.room),
      };

    default:
      return state;
  }
};
