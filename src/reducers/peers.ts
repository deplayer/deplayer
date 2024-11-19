import { PeerStatus } from "../services/PeerService";
import * as types from '../constants/ActionTypes'

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
    case types.UPDATE_PEER_STATUS:
      return {
        ...state,
        peers: [
          ...state.peers.filter(peer => peer.peerId !== action.peerId),
          { ...action.data, peerId: action.peerId },
        ],
      };
    case types.SET_CURRENT_ROOM:
      return {
        ...state,
        currentRoom: action.roomCode,
      };
    case types.PEER_JOINED:
      return {
        ...state,
        peers: [...state.peers, action.peer],
      };
    case types.PEER_LEFT:
      return {
        ...state,
        peers: state.peers.filter((peer) => peer !== action.peerd),
      };
    default:
      return state;
  }
}
