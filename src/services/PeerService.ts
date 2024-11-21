import { Dispatch } from "redux";
import { Room, ActionSender, DataPayload } from "trystero";
import { joinRoom, selfId } from "trystero/nostr";
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
  private sendUsername: ActionSender<DataPayload> | undefined;
  private readonly dispatchFn: Dispatch;
  private username: string = '';
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
    this.username = username;
    await this.setupCommunicationChannels()
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

  private async setupCommunicationChannels() {
    if (!this.room) return;

    // Set up communication channels
    const [sendStatus, getStatus] = this.room.makeAction("status");
    const [sendMediaRequest, getMedia] = this.room.makeAction("media");
    const [sendUsername, getUsername] = this.room.makeAction("username");

    // Bind handlers
    getStatus(this.handlePeerStatus);
    getMedia(this.handleMediaRequest);
    getUsername(this.handleGetUsername);

    this.sendStatus = sendStatus;
    this.sendUsername = sendUsername;
    this.sendMediaRequest = sendMediaRequest;

    if (this.sendUsername) {
      this.sendUsername({ peerId: selfId, username: this.username });
    }

    // Set up peer event handlers
    this.setupPeerEventHandlers();
  }

  private handleGetUsername = (data: DataPayload, peerId: string) => {
    if (peerId === selfId) return;

    const username = (data as { username: string });

    this.dispatchFn({
      type: types.PEER_SET_USERNAME,
      peer: { peerId, username: username.username },
    });

    this.dispatchFn({
      type: types.SEND_NOTIFICATION,
      notification: `${username.username} joined the room`,
      level: "info",
    });
  }

  private setupPeerEventHandlers() {
    if (!this.room) return;

    // This is called when host joined a room. 
    this.room.onPeerJoin((peerId) => {
      this.dispatchFn({
        type: types.PEER_JOINED,
        peer: { peerId, isPlaying: false },
      })
    })

    this.room.onPeerLeave((peerId) => {
      this.dispatchFn({
        type: types.PEER_LEFT,
        peer: { peerId, isPlaying: false },
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
