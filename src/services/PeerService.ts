import { Dispatch } from "redux";
import { Room, ActionSender, DataPayload, JsonValue } from "trystero";
import { joinRoom } from "trystero/nostr";
import * as types from "../constants/ActionTypes";
import { IMedia } from "../entities/Media";
import { State as CollectionState } from "../reducers/collection";
import { MediaFileService } from "./MediaFileService";
import { writeFile } from "@happy-js/happy-opfs";

// Interfaces
export interface PeerStatus {
  currentSong?: string;
  username: string;
  peerId: string;
  isPlaying: boolean;
  media?: IMedia;
  roomCode: string;
}

interface RoomState {
  room: Room;
  sendStatus: ActionSender<DataPayload>;
  sendMediaRequest: ActionSender<DataPayload>;
  sendUsername: ActionSender<DataPayload>;
  sendStream: ActionSender<DataPayload>;
  peers: Map<string, DataPayload>;
}

export default class PeerService {
  private static instance: PeerService | null = null;
  private rooms: Map<string, RoomState> = new Map();
  private config = { appId: "deplayer-p2p" };
  private readonly dispatchFn: Dispatch;
  private username: string = "";
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
    this.username = username;
    const room = joinRoom(this.config, roomCode);
    await this.setupCommunicationChannels(room, roomCode);
  }

  /**
   * Client sends status update to peers in a specific room
   */
  updateStatus = (status: DataPayload, roomCode: string) => {
    const roomState = this.rooms.get(roomCode);
    if (!roomState) {
      throw new Error(`Cannot update status: Room ${roomCode} not found`);
    }
    console.log("Updating status", status, roomCode);

    roomState.sendStatus(status);
  };

  /**
   * Client requests media stream from a peer in a specific room
   */
  requestStream = async (peerId: string, media: IMedia, roomCode: string) => {
    const roomState = this.rooms.get(roomCode);
    if (!roomState) return;

    console.log("Requesting stream", peerId, media, roomCode);
    roomState.sendMediaRequest({ peerId, mediaId: media.id! });
  };

  /**
   * Client leaves a specific room
   */
  leaveRoom = (roomCode: string) => {
    const roomState = this.rooms.get(roomCode);
    if (roomState) {
      roomState.room.leave();
      this.cleanupRoom(roomCode);
    }
  };

  /**
   * Client leaves all rooms
   */
  leaveAllRooms = () => {
    for (const roomCode of this.rooms.keys()) {
      this.leaveRoom(roomCode);
    }
  };

  // SERVER METHODS
  // -------------

  private handlePeerStatus =
    (roomCode: string) => (data: DataPayload, peerId: string) => {
      const roomState = this.rooms.get(roomCode);
      if (!roomState) return;

      const peerData = {
        ...(data as object),
        roomCode,
      };

      roomState.peers.set(peerId, peerData);
      this.dispatchFn({
        type: types.UPDATE_PEER_STATUS,
        peerId,
        data: peerData,
        roomCode,
      });
    };

  private handleMediaRequest = async (roomCode: string, streamData: any) => {
    console.log("Preparing media request", streamData);

    const mediaId = streamData.mediaId;
    const media = this.collection?.rows[mediaId];

    if (!media) {
      console.error("Media not found in collection", mediaId);
      return;
    }

    return await this.processMediaRequest(media, roomCode);
  };

  // HELPER METHODS
  // -------------
  private async setupCommunicationChannels(room: Room, roomCode: string) {
    // Set up communication channels
    const [sendStatus, getStatus] = room.makeAction("status");
    const [sendMediaRequest, getMedia] = room.makeAction("media");
    const [sendStream, getStream] = room.makeAction("stream");
    const [sendUsername, getUsername] = room.makeAction("username");

    // Create room state
    const roomState: RoomState = {
      room,
      sendStatus,
      sendMediaRequest,
      sendUsername,
      sendStream,
      peers: new Map(),
    };

    // Store room state
    this.rooms.set(roomCode, roomState);

    // Dispatch room added to Redux
    this.dispatchFn({ type: types.ADD_ROOM, room: roomCode });

    // Bind handlers with room context
    getStatus(this.handlePeerStatus(roomCode));
    getMedia((data) => this.handleMediaRequest(roomCode, data));
    getStream((data, peerId, metadata) => {
      console.log("Received stream", data, peerId, metadata, roomCode);
      this.handleStream(data, peerId, metadata);
    });
    getUsername((data, peerId) =>
      this.handleGetUsername(data, peerId, roomCode)
    );

    // Set up peer event handlers
    this.setupPeerEventHandlers(room, roomCode);
  }

  private handleGetUsername = (
    data: DataPayload,
    peerId: string,
    roomCode: string
  ) => {
    const username = data as { username: string };

    this.dispatchFn({
      type: types.PEER_SET_USERNAME,
      peer: { peerId, username: username.username, roomCode },
    });

    this.dispatchFn({
      type: types.SEND_NOTIFICATION,
      notification: `${username.username} joined the room ${roomCode}`,
      level: "info",
    });
  };

  private handleStream = async (
    data: DataPayload,
    _peerId: string,
    metadata: JsonValue | undefined
  ) => {
    if (!data || !metadata) return;

    const media = (metadata as any).media as IMedia;

    const songFsUri = `/${media.id}`;
    await writeFile(songFsUri, data as ArrayBuffer);
    const modifiedMedia = {
      ...media,
      stream: {
        ...media.stream,
        opfs: {
          service: "opfs",
          uris: [{ uri: `opfs:///${media.id}` }],
        },
      },
    };

    this.dispatchFn({ type: types.ADD_TO_COLLECTION, data: [modifiedMedia] });
    this.dispatchFn({
      type: types.RECEIVE_COLLECTION,
      data: [modifiedMedia],
    });
    this.dispatchFn({
      type: types.SEND_NOTIFICATION,
      notification: `${this.username} shared ${media.title}`,
    });
  };

  private setupPeerEventHandlers(room: Room, roomCode: string) {
    room.onPeerJoin((peerId) => {
      const roomState = this.rooms.get(roomCode);
      if (roomState && roomState.sendUsername) {
        roomState.sendUsername({ peerId, username: this.username });
      }

      this.dispatchFn({
        type: types.PEER_JOINED,
        peer: { peerId, isPlaying: false, roomCode },
      });
    });

    room.onPeerLeave((peerId) => {
      this.dispatchFn({
        type: types.PEER_LEFT,
        peer: { peerId, isPlaying: false, roomCode },
      });
    });
  }

  private async processMediaRequest(media: IMedia, roomCode: string) {
    const mediaFile = await MediaFileService.getMediaFile(media);
    const roomState = this.rooms.get(roomCode);

    if (!mediaFile || !roomState) {
      console.error("Could not process media request", {
        mediaFile,
        roomState,
      });
      return null;
    }

    const { stream, createdAt, updatedAt, ...fixedMedia } = media as IMedia & {
      createdAt: string;
      updatedAt: string;
    };

    console.log("Sending stream", mediaFile, fixedMedia);

    roomState.sendStream(mediaFile, null, {
      media: fixedMedia,
    } as unknown as JsonValue);

    return mediaFile;
  }

  private cleanupRoom(roomCode: string) {
    const roomState = this.rooms.get(roomCode);
    if (roomState) {
      roomState.peers.clear();
      this.rooms.delete(roomCode);

      // Dispatch room removed to Redux
      this.dispatchFn({ type: types.REMOVE_ROOM, room: roomCode });
    }
    this.dispatchFn({ type: types.RESET_PEER_STATUS, roomCode });
  }

  // PUBLIC GETTERS
  // -------------

  getPeers = (roomCode: string): DataPayload[] => {
    const roomState = this.rooms.get(roomCode);
    return roomState ? Array.from(roomState.peers.values()) : [];
  };

  getAllPeers = (): DataPayload[] => {
    const allPeers: DataPayload[] = [];
    for (const roomState of this.rooms.values()) {
      allPeers.push(...Array.from(roomState.peers.values()));
    }
    return allPeers;
  };

  getRooms = (): string[] => {
    // This method can be removed as rooms will be accessed from Redux state
    return Array.from(this.rooms.keys());
  };

  generateShareCode = (): string => {
    return Math.random().toString(36).substring(2, 8);
  };
}
