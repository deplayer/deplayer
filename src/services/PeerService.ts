import { joinRoom } from "trystero/torrent";

export interface PeerStatus {
  currentSong?: string;
  username: string;
  peerId: string;
  isPlaying: boolean;
}

export default class PeerService {
  private room: any;
  private peers: Map<string, PeerStatus> = new Map();
  private config = { appId: "deplayer-p2p" };
  private sendStatus: any;
  private sendStream: any;
  private readonly dispatchFn: any;

  constructor(dispatch: any) {
    this.dispatchFn = dispatch;
  }

  async joinWithCode(roomCode: string, username: string) {
    this.room = joinRoom(this.config, roomCode);

    const [sendStatus, getStatus] = this.room.makeAction("status");

    getStatus((status: PeerStatus, peerId: string) => {
      this.peers.set(peerId, status);
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

    this.updateStatus({
      username,
      peerId: this.room.peerId,
      isPlaying: false,
    });
  }

  updateStatus(status: PeerStatus) {
    if (this.sendStatus) {
      this.sendStatus(status);
    }
  }

  shareStream(streamUrl: string, songId: string) {
    if (this.sendStream) {
      this.sendStream({ streamUrl, songId });
    }
  }

  getPeers(): PeerStatus[] {
    return Array.from(this.peers.values());
  }

  generateShareCode(): string {
    return Math.random().toString(36).substring(2, 8);
  }

  public getPeerId(): string | undefined {
    return this.room?.peerId;
  }
}
