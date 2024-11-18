import { PeerStatus } from "../services/PeerService";

export interface State {
  peers: PeerStatus[];
  currentRoom?: string;
}

const initialState: State = {
  peers: [],
  currentRoom: undefined,
};

export default function peers(state = initialState, action: any): State {
  switch (action.type) {
    case "UPDATE_PEER_STATUS":
      return {
        ...state,
        peers: action.peers,
      };
    case "SET_CURRENT_ROOM":
      return {
        ...state,
        currentRoom: action.roomCode,
      };
    default:
      return state;
  }
}
