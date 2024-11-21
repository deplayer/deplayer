import { PeerStatus } from "../services/PeerService";
import * as types from "../constants/ActionTypes";

export interface State {
  peers: Record<string, PeerStatus>;
  currentRoom?: string;
}

const initialState: State = {
  peers: {},
  currentRoom: undefined,
};

export default function peers(state = initialState, action: any): State {
  switch (action.type) {
    case types.UPDATE_PEER_STATUS:
      return {
        ...state,
        peers: {
          ...state.peers,
          [action.peerId]: action.data,
        },
      };
    case types.SET_CURRENT_ROOM:
      return {
        ...state,
        currentRoom: action.roomCode,
      };
    case types.PEER_SET_USERNAME:
      const { peerId, username } = action.peer;

      return {
        ...state,
        peers: {
          ...state.peers,
          [peerId]: { ...state.peers[peerId], username },
        },
      };
    case types.PEER_JOINED:
      return {
        ...state,
        peers: {
          ...state.peers,
          [action.peer.peerId]: action.peer,
        },
      };
    case types.PEER_LEFT:
      const { [action.peer.peerId]: removedPeer, ...remainingPeers } =
        state.peers;
      return {
        ...state,
        peers: remainingPeers,
      };
    default:
      return state;
  }
}
