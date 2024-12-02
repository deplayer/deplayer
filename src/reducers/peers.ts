import { PeerStatus } from "../services/PeerService";
import * as types from "../constants/ActionTypes";

export interface State {
  peers: Record<string, Record<string, PeerStatus>>;
}

const initialState: State = {
  peers: {},
};

interface UpdatePeerStatusAction {
  type: typeof types.UPDATE_PEER_STATUS;
  data: PeerStatus;
  peerId: string;
  roomCode: string;
}

interface SetUsernameAction {
  type: typeof types.PEER_SET_USERNAME;
  peer: PeerStatus;
}

interface JoinRoomAction {
  type: typeof types.PEER_JOINED;
  peer: PeerStatus;
}

interface LeaveRoomAction {
  type: typeof types.PEER_LEFT;
  peer: PeerStatus;
}

interface SetStreamingPeerAction {
  type: typeof types.SET_STREAMING_PEER;
  peerId: string;
}

export default function peers(
  state = initialState,
  action:
    | UpdatePeerStatusAction
    | SetUsernameAction
    | JoinRoomAction
    | LeaveRoomAction
    | SetStreamingPeerAction
): State {
  switch (action.type) {
    case types.UPDATE_PEER_STATUS:
      if (!action.data.roomCode) {
        return state;
      }
      return {
        ...state,
        peers: {
          ...state.peers,
          [action.data.roomCode]: {
            ...(state.peers[action.data.roomCode] || {}),
            [action.peerId]: action.data,
          },
        },
      };
    case types.PEER_SET_USERNAME:
      const { peerId, username, roomCode } = action.peer;
      return {
        ...state,
        peers: {
          ...state.peers,
          [roomCode]: {
            ...(state.peers[roomCode] || {}),
            [peerId]: { ...state.peers[roomCode]?.[peerId], username },
          },
        },
      };
    case types.PEER_JOINED:
      return {
        ...state,
        peers: {
          ...state.peers,
          [action.peer.roomCode]: {
            ...(state.peers[action.peer.roomCode] || {}),
            [action.peer.peerId]: action.peer,
          },
        },
      };
    case types.PEER_LEFT:
      const roomPeers = state.peers[action.peer.roomCode] || {};
      const { [action.peer.peerId]: removedPeer, ...remainingPeers } =
        roomPeers;
      return {
        ...state,
        peers: {
          ...state.peers,
          [action.peer.roomCode]: remainingPeers,
        },
      };
    case types.SET_STREAMING_PEER:
      const foundPeer = Object.values(state.peers)
        .flatMap((roomPeers) => Object.values(roomPeers))
        .find((peer) => peer.peerId === action.peerId);

      if (!foundPeer) {
        return state;
      }

      return {
        ...state,
        peers: {
          ...state.peers,
          [foundPeer.roomCode]: {
            ...state.peers[foundPeer.roomCode],
            [action.peerId]: { ...foundPeer, streaming: true },
          },
        },
      };
    default:
      return state;
  }
}
