import { IStorageService } from "./IStorageService";
import { IAdapter } from "./database/IAdapter";
import { createLogger } from "../utils/logger";

interface Peer {
  id: string;
  roomCode: string;
  username: string;
}

const MODEL = "peer";

const logger = createLogger({ namespace: "PeerStorageService" });

export default class PeerStorageService implements IStorageService {
  storageAdapter: IAdapter;

  constructor(storageAdapter: IAdapter) {
    this.storageAdapter = storageAdapter;
  }

  initialize = async (): Promise<void> => {
    await this.storageAdapter.initialize(MODEL);
  };

  get = async (): Promise<Peer[]> => {
    logger.debug("get", MODEL);
    return await this.storageAdapter.getAll(MODEL, {});
  };

  save = async (id: string, peer: any): Promise<any> => {
    return await this.storageAdapter.save(MODEL, id, peer);
  };

  findByRoomAndUsername = async (
    roomCode: string,
    username: string
  ): Promise<Peer | undefined> => {
    const peers = await this.get();
    return peers.find(
      (peer: Peer) => peer.roomCode === roomCode && peer.username === username
    );
  };

  removeAll = async (): Promise<any> => {
    return await this.storageAdapter.removeCollection(MODEL);
  };

  removeByRoom = async (roomCode: string): Promise<void> => {
    const peers = await this.get();

    logger.info("Total peers:", peers);

    const peersToRemove = peers.filter((peer) => peer.roomCode === roomCode);

    logger.debug("peersToRemove:", peersToRemove);

    if (peersToRemove.length > 0) {
      await this.storageAdapter.removeMany(
        MODEL,
        peersToRemove.map((peer) => peer.id)
      );
    }
  };
}
