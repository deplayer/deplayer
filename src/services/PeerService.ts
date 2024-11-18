import { Dispatch } from 'redux';
import { Room, ActionSender, DataPayload } from "trystero";
import { joinRoom } from "trystero/nostr";

export interface PeerStatus {
  currentSong?: string;
  username: string;
  peerId: string;
  isPlaying: boolean;
  currentMedia?: {
    id: string;
    title: string;
    artist: string;
    thumbnailUrl?: string;
  };
}

export default class PeerService {
  private room: Room | undefined;
  private peerId: string | undefined;
  private peers: Map<string, DataPayload> = new Map();
  private config = { appId: "deplayer-p2p" };
  private sendStatus: ActionSender<DataPayload> | undefined;
  private sendStream: ActionSender<DataPayload> | undefined;
  private readonly dispatchFn: Dispatch;

  constructor(dispatch: Dispatch) {
    if (typeof dispatch !== 'function') {
      throw new Error('dispatch must be a function');
    }
    this.dispatchFn = dispatch;
  }

  async joinWithCode(roomCode: string, username: string) {
    this.room = joinRoom(this.config, roomCode);

    const [sendStatus, getStatus] = this.room.makeAction("status");

    getStatus((data: DataPayload, peerId: string) => {
      this.peers.set(peerId, data);
      this.peerId = peerId;
      this.dispatchFn({
        type: "UPDATE_PEER_STATUS",
        peers: Array.from(this.peers.values()),
      });
    });

    const [sendStream, getStream] = this.room.makeAction("stream");

    getStream(async (streamData: any, _peerId: string) => {
      this.dispatchFn({
        type: "SET_CURRENT_PLAYING_URL",
        url: streamData.streamUrl,
      });
      this.dispatchFn({
        type: "SET_CURRENT_PLAYING",
        songId: streamData.songId,
      });
    });

    this.sendStatus = sendStatus;
    this.sendStream = sendStream;

    this.room.onPeerJoin(peerId => {
      this.updateStatus({
        username,
        peerId: peerId,
        isPlaying: false,
      });

      console.log(`${peerId} joined`)
    })

    this.room.onPeerLeave(peerId => {
      this.peers.delete(peerId);
      this.dispatchFn({
        type: "UPDATE_PEER_STATUS",
        peers: Array.from(this.peers.values()),
      });
      console.log(`${peerId} left`)
    })
  }

  updateStatus(status: DataPayload) {
    if (this.sendStatus) {
      this.peers.set(this.getPeerId()!, status);
      this.sendStatus(status);
      this.dispatchFn({
        type: "UPDATE_PEER_STATUS",
        peers: Array.from(this.peers.values()),
      });
    }
  }

  shareStream(streamUrl: string, songId: string, mediaInfo: any) {
    if (this.sendStream) {
      this.sendStream({ 
        streamUrl, 
        songId,
        mediaInfo: {
          title: mediaInfo.title,
          artist: mediaInfo.artistName,
          thumbnailUrl: mediaInfo.cover?.thumbnailUrl
        }
      });
    }
  }

  getPeers(): DataPayload[] {
    return Array.from(this.peers.values());
  }

  generateShareCode(): string {
    return Math.random().toString(36).substring(2, 8);
  }

  public getPeerId(): string | undefined {
    return this.peerId
  }

  leaveRoom() {
    if (this.room) {
      this.room.leave();
      this.room = undefined;
      this.peers.clear();
      this.sendStatus = undefined;
      this.sendStream = undefined;
      this.peerId = undefined;
      
      this.dispatchFn({
        type: "UPDATE_PEER_STATUS",
        peers: [],
      });
    }
  }
}
