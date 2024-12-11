import { Dispatch } from "redux";
import { Room, ActionSender, DataPayload, JsonValue, selfId } from "trystero";
import * as types from "../constants/ActionTypes";
import Media, { IMedia } from "../entities/Media";
import { State as CollectionState } from "../reducers/collection";
import { MediaFileService } from "./MediaFileService";
import { writeFile } from "@happy-js/happy-opfs";
import PlayerRefService from "./PlayerRefService";
// Interfaces
export interface PeerStatus {
  currentSong?: string;
  username: string;
  peerId: string;
  isPlaying: boolean;
  media?: IMedia;
  roomCode: string;
  streaming: boolean;
}

interface RoomState {
  room: Room;
  sendMediaRequest: ActionSender<DataPayload>;
  sendUsername: ActionSender<DataPayload>;
  sendStream: ActionSender<DataPayload>;
  sendRealtimeStream: ActionSender<DataPayload>;
  notifyCurrentPlayingToRoom: ActionSender<DataPayload>;
  peers: Map<string, DataPayload>;
}

export default class PeerService {
  private static instance: PeerService | null = null;
  private config = { appId: "deplayer-p2p" };
  private readonly dispatchFn: Dispatch;
  private username: string = "";
  rooms: Map<string, RoomState> = new Map();
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
    this.dispatchFn({
      type: types.JOIN_ROOM_REQUESTED,
      payload: {
        roomCode,
        username,
        config: this.config,
      },
    });
  }

  /**
   * Client requests media stream from a peer in a specific room
   */
  requestSongFile = async (peerId: string, media: IMedia, roomCode: string) => {
    this.dispatchFn({
      type: types.REQUEST_SONG_FILE,
      payload: {
        peerId,
        media,
        roomCode,
      },
    });
  };

  /**
   * Client leaves a specific room
   */
  leaveRoom = (roomCode: string) => {
    this.dispatchFn({
      type: types.LEAVE_ROOM_REQUESTED,
      payload: {
        roomCode,
      },
    });
  };

  private handleMediaRequest = async (roomCode: string, streamData: any) => {
    this.dispatchFn({
      type: types.ADD_TO_COLLECTION,
      data: [streamData.media],
    });

    // Mark something in the database so I can persist the opened session between songs and restarts
    this.dispatchFn({
      type: types.SET_STREAMING_PEER,
      peerId: streamData.peerId,
    });

    return await this.processMediaRequest(streamData.media, roomCode);
  };

  // HELPER METHODS
  // -------------
  setupCommunicationChannels(room: Room, roomCode: string) {
    // Set up communication channels
    const [sendMediaRequest, getMedia] = room.makeAction("media");
    const [sendStream, getStream] = room.makeAction("stream");
    const [sendRealtimeStream, getRealtimeStream] = room.makeAction("realtime");
    const [notifyCurrentPlayingToRoom, getCurrentPlaying] =
      room.makeAction("playing");
    const [sendUsername, getUsername] = room.makeAction("username");

    // Create room state
    const roomState: RoomState = {
      room,
      sendMediaRequest,
      sendUsername,
      sendStream,
      sendRealtimeStream,
      notifyCurrentPlayingToRoom,
      peers: new Map(),
    };

    // Store room state
    this.rooms.set(roomCode, roomState);

    // Bind handlers with room context
    getMedia((data) => this.handleMediaRequest(roomCode, data));
    getStream((data, _peerId, metadata) => {
      this.handleStream(data, _peerId, metadata);
    });
    getRealtimeStream((data, peerId, metadata) => {
      this.handleRealtimeStream(data, peerId, metadata);
    });
    getUsername((data, peerId) =>
      this.handleGetUsername(data, peerId, roomCode)
    );
    getCurrentPlaying((data, peerId) => {
      this.handleCurrentPlaying(data, peerId);
    });

    // Set up peer event handlers
    this.setupPeerEventHandlers(room, roomCode);

    return roomState;
  }

  private handleCurrentPlaying = (data: DataPayload, peerId: string) => {
    this.dispatchFn({
      type: types.SET_PEER_CURRENT_PLAYING,
      payload: {
        data,
        peerId,
      },
    });
  };

  private handleRealtimeStream = (
    data: DataPayload,
    peerId: string,
    metadata: JsonValue | undefined
  ) => {
    const playerRef = PlayerRefService.getInstance();
    const mediaElement = playerRef.getCurrentMedia();
    // const currentMedia = this.collection?.rows[mediaId]

    console.log("Sending the following data to be streamed", metadata);

    const roomCode = (data as any).roomCode;
    const roomState = this.rooms.get(roomCode);

    if (!roomState || !mediaElement?.captureStream) {
      console.warn(
        "Cannot capture stream: Media element or captureStream not supported"
      );
      return;
    }

    this.dispatchFn({
      type: types.SET_STREAMING_PEER,
      peerId,
    });

    try {
      const mediaStream = mediaElement.captureStream(30);
      if (mediaStream) {
        roomState.room.addStream(mediaStream, null);
      }
    } catch (error) {
      console.error("Error capturing media stream:", error);
    }
  };

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

  sendRealtimeStream = async (roomCode: string, media: IMedia) => {
    const roomState = this.rooms.get(roomCode);
    if (!roomState) return;

    roomState.room.onPeerStream((stream, peerId) => {
      // Store the stream first
      PlayerRefService.getInstance().setPeerStream(stream);

      const streamDef = {
        uris: [{ url: "peer://" + peerId, service: "peer" }],
        service: "peer",
      };
      const fixedMedia = new Media({ ...media, stream: streamDef as any });

      // Dispatch actions
      this.dispatchFn({ type: types.ADD_TO_COLLECTION, data: [fixedMedia] });
      this.dispatchFn({
        type: types.SET_PEER_STREAMING,
        payload: {
          peerId,
          isStreaming: true,
        },
      });
      this.dispatchFn({ type: types.SHOW_PLAYER });
      this.dispatchFn({ type: types.SET_CURRENT_PLAYING, songId: media.id });
      this.dispatchFn({
        type: types.SET_CURRENT_PLAYING_URL,
        url: "peer://" + peerId,
      });
      this.dispatchFn({ type: types.START_PLAYING });
    });

    return roomState.sendRealtimeStream({
      requesterId: selfId,
      roomCode,
      media: media as unknown as JsonValue,
    });
  };

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
