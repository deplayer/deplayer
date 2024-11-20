import { Dispatch } from "redux";
import { Room, ActionSender, DataPayload } from "trystero";
import { joinRoom } from "trystero/nostr";
import * as types from "../constants/ActionTypes";
import { IMedia } from "../entities/Media";
import { State as CollectionState } from "../reducers/collection";
import { MediaFileService } from "./MediaFileService";

// Interfaces
export interface PeerStatus {
  currentSong?: string;
  username: string;
  peerId: string;
  isPlaying: boolean;
  media?: IMedia;
}

export default class PeerService {
  private static instance: PeerService | null = null;
  private room: Room | undefined;
  private peerId: string | undefined;
  private peers: Map<string, DataPayload> = new Map();
  private config = { appId: "deplayer-p2p" };
  private sendStatus: ActionSender<DataPayload> | undefined;
  private sendMediaRequest: ActionSender<DataPayload> | undefined;
  private readonly dispatchFn: Dispatch;
  collection: CollectionState | null;

  // Singleton getter
  static getInstance(dispatch: Dispatch): PeerService {
    if (!PeerService.instance) {
      PeerService.instance = new PeerService(dispatch);
    }
    return PeerService.instance;
  }

  private constructor(dispatch: Dispatch) {
    if (typeof dispatch !== "function") {
      throw new Error("dispatch must be a function");
    }
    this.dispatchFn = dispatch;
    this.collection = null;
  }

  // CLIENT METHODS
  // -------------

  /**
   * Client initiates joining a room
   */
  async joinWithCode(roomCode: string, username: string) {
    this.room = joinRoom(this.config, roomCode);
    await this.setupCommunicationChannels(username);
  }

  /**
   * Client sends status update to peers
   */
  updateStatus = (status: DataPayload) => {
    if (!this.room || !this.sendStatus) {
      throw new Error("Cannot update status: Not properly connected");
    }
    this.sendStatus(status);
  };

  /**
   * Client requests media stream from a peer
   */
  requestStream = async (peerId: string, media: IMedia) => {
    if (!this.sendMediaRequest) return;
    this.sendMediaRequest({ peerId, mediaId: media.id! });
  };

  /**
   * Client leaves the room
   */
  leaveRoom = () => {
    if (this.room) {
      this.room.leave();
      this.cleanupRoom();
    }
  };

  // SERVER METHODS
  // -------------

  /**
   * Server handles incoming status updates
   */
  private handlePeerStatus = (data: DataPayload, peerId: string) => {
    this.peers.set(peerId, data);
    this.peerId = peerId;
    this.dispatchFn({
      type: types.UPDATE_PEER_STATUS,
      peerId: peerId,
      data: data,
    });
  };

  /**
   * Server handles incoming media requests
   */
  private handleMediaRequest = async (streamData: any) => {
    const mediaId = streamData.mediaId;
    const media = this.collection?.rows[mediaId];

    if (!media) {
      console.error("Media not found in collection", mediaId);
      return;
    }

    return await this.processMediaRequest(media);
  };

  // HELPER METHODS
  // -------------

  private async setupCommunicationChannels(username: string) {
    if (!this.room) return;

    // Set up communication channels
    const [sendStatus, getStatus] = this.room.makeAction("status");
    const [sendMediaRequest, getMedia] = this.room.makeAction("media");

    // Bind handlers
    getStatus(this.handlePeerStatus);
    getMedia(this.handleMediaRequest);

    this.sendStatus = sendStatus;
    this.sendMediaRequest = sendMediaRequest;

    // Set up peer event handlers
    this.setupPeerEventHandlers(username);
  }

  private setupPeerEventHandlers(username: string) {
    if (!this.room) return;

    this.room.onPeerJoin((peerId) => {
      this.dispatchFn({
        type: types.PEER_JOINED,
        peer: { username, peerId, isPlaying: false },
      })

      this.dispatchFn({
        type: types.SEND_NOTIFICATION,
        notification: `${username} joined the room`,
        level: "info",
      });
    })

    this.room.onPeerLeave((peerId) => {
      this.dispatchFn({
        type: types.PEER_LEFT,
        peer: { username, peerId, isPlaying: false },
      });

      this.dispatchFn({
        type: types.SEND_NOTIFICATION,
        notification: `${username} left the room`,
        level: "info",
      });
    });
  }

  private async processMediaRequest(media: IMedia) {
    const mediaFile = await MediaFileService.getMediaFile(media);
    if (!mediaFile) {
      console.error("Could not get media file", media);
      return null;
    }
    return mediaFile;
  }

  private cleanupRoom() {
    this.room = undefined;
    this.peers.clear();
    this.sendStatus = undefined;
    this.sendMediaRequest = undefined;
    this.peerId = undefined;
    this.dispatchFn({ type: types.RESET_PEER_STATUS });
  }

  // PUBLIC GETTERS
  // -------------
  
  getPeers = (): DataPayload[] => {
    return Array.from(this.peers.values());
  };

  getPeerId = (): string | undefined => {
    return this.peerId;
  };

  generateShareCode = (): string => {
    return Math.random().toString(36).substring(2, 8);
  };
}
