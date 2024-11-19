import { Dispatch } from "redux";
import { Room, ActionSender, DataPayload } from "trystero";
import { joinRoom } from "trystero/nostr";
import * as types from "../constants/ActionTypes";
import { hasAnyProviderOf, IMedia } from "../entities/Media";
import axios from "axios";
import { writeFile, readFile } from "@happy-js/happy-opfs";
import { State as CollectionState } from "../reducers/collection";
/**
 * Interface representing the status of a peer in the network
 */
export interface PeerStatus {
  /** The title of the currently playing song */
  currentSong?: string;
  /** The username of the peer */
  username: string;
  /** Unique identifier for the peer */
  peerId: string;
  /** Whether the peer is currently playing media */
  isPlaying: boolean;
  /** Information about the currently playing media */
  media?: IMedia;
}

/**
 * Service class handling peer-to-peer communication and media sharing
 */
export default class PeerService {
  private static instance: PeerService | null = null;
  /** The current room instance */
  private room: Room | undefined;
  /** Unique identifier for the current peer */
  private peerId: string | undefined;
  /** Map of connected peers and their status */
  private peers: Map<string, DataPayload> = new Map();
  /** Configuration for the p2p network */
  private config = { appId: "deplayer-p2p" };
  /** Function to send status updates to other peers */
  private sendStatus: ActionSender<DataPayload> | undefined;
  /** Function to send stream information to other peers */
  private sendMediaRequest: ActionSender<DataPayload> | undefined;
  /** Redux dispatch function */
  private readonly dispatchFn: Dispatch;
  /** Collection state */
  collection: CollectionState | null;

  static getInstance(
    dispatch: Dispatch
  ): PeerService {
    if (!PeerService.instance) {
      PeerService.instance = new PeerService(dispatch);
    }
    return PeerService.instance;
  }

  /**
   * Creates a new PeerService instance
   * @param dispatch - Redux dispatch function for updating the store
   * @throws {Error} If dispatch is not a function
   */
  private constructor(dispatch: Dispatch) {
    if (typeof dispatch !== "function") {
      throw new Error("dispatch must be a function");
    }
    this.dispatchFn = dispatch;
    this.collection = null
  }

  /**
   * Joins a room with the specified code and username
   * @param roomCode - Unique identifier for the room
   * @param username - Display name for the current peer
   */
  async joinWithCode(roomCode: string, username: string) {
    this.room = joinRoom(this.config, roomCode);

    // Set up communication channels
    const [sendStatus, getStatus] = this.room.makeAction("status");
    const [sendMediaRequest, getMedia] = this.room.makeAction("media");

    // Handle incoming status updates
    getStatus((data: DataPayload, peerId: string) => {
      console.log("Received status update from peer:", peerId);
      this.peers.set(peerId, data);
      this.peerId = peerId;
      this.dispatchFn({
        type: types.UPDATE_PEER_STATUS,
        peerId: peerId,
        data: data,
      });
    });

    // Handle incoming stream data
    getMedia(async (streamData: any) => {
      const mediaId = streamData.mediaId;
      const media = this.collection?.rows[mediaId];

      if (!media) {
        console.log("Media not found in collection", this.collection?.rows);
        console.error("Media not found in collection", mediaId);
        return;
      }

      const songFsUri = `/${mediaId}`;

      if (hasAnyProviderOf(media, ["opfs"])) {
        console.log("Media already in OPFS", media);

        const songData = await readFile(songFsUri);
        return songData;
      }

      if (hasAnyProviderOf(media, ["filesystem"])) {
        // Read file from FileHandler
        // const songData = await readFile(songFsUri)
        // return songData
        console.log("Requesting stream from filesystem", media);
        return;
      }

      console.log("Storing song data", songFsUri, media);
      const streamUrl = Object.values(
        media.stream as Record<string, { uris: { uri: string }[] }>
      )[0].uris[0].uri;

      if (!streamUrl) {
        console.error("No stream url found for song", media);
        return;
      }

      const fileData = await axios.get(streamUrl, { responseType: "blob" });
      await writeFile(songFsUri, fileData.data);
      return streamData;
    });

    this.sendStatus = sendStatus;
    this.sendMediaRequest = sendMediaRequest;

    // Handle peer join events
    this.room.onPeerJoin((peerId) => {
      this.dispatchFn({
        type: types.PEER_JOINED,
        peer: {
          username,
          peerId: peerId,
          isPlaying: false,
        },
      });
    });

    // Handle peer leave events
    this.room.onPeerLeave((peerId) => {
      this.dispatchFn({
        type: types.PEER_LEFT,
        peer: {
          username,
          peerId: peerId,
          isPlaying: false,
        },
      });
    });
  }

  /**
   * Updates and broadcasts the current peer's status
   * @param status - Current status information to share
   * @throws {Error} If trying to update status before joining a room
   */
  updateStatus = (status: DataPayload) => {
    if (!this.room) {
      throw new Error("Cannot update status: Not connected to a room");
    }

    if (!this.sendStatus) {
      throw new Error("Cannot update status: No sendStatus function");
    }

    console.log("updateStatus", status);
    this.sendStatus(status);
  };

  /**


   */

  requestStream = async (peerId: string, media: IMedia) => {
    if (!this.sendMediaRequest) {
      return;
    }
    this.sendMediaRequest({ peerId, mediaId: media.id! });
  };

  /**
   * Returns an array of all connected peers
   * @returns Array of peer status information
   */
  getPeers = (): DataPayload[] => {
    return Array.from(this.peers.values());
  };

  /**
   * Generates a random room code
   * @returns A 6-character alphanumeric code
   */
  generateShareCode = (): string => {
    return Math.random().toString(36).substring(2, 8);
  };

  /**
   * Gets the current peer's ID
   * @returns The peer ID or undefined if not connected
   */
  public getPeerId = (): string | undefined => {
    return this.peerId;
  };

  /**
   * Leaves the current room and cleans up all connections
   */
  leaveRoom = () => {
    if (this.room) {
      this.room.leave();
      this.room = undefined;
      this.peers.clear();
      this.sendStatus = undefined;
      this.sendMediaRequest = undefined;
      this.peerId = undefined;

      this.dispatchFn({
        type: types.RESET_PEER_STATUS,
      });
    }
  };
}
