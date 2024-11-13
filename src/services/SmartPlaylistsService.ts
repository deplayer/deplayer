import { SmartPlaylist } from "../types/SmartPlaylist";
import { IStorageService } from "./IStorageService";
import { IAdapter } from "./database/IAdapter";

export default class SmartPlaylistsService implements IStorageService {
  storageAdapter: IAdapter;

  constructor(adapter: IAdapter) {
    this.storageAdapter = adapter;
  }

  initialize = async (): Promise<void> => {
    await this.storageAdapter.initialize("smart_playlist");
  };

  save = async (_type: string, smartPlaylist: SmartPlaylist): Promise<void> => {
    await this.storageAdapter.save(
      "smart_playlist",
      "smart_playlist",
      smartPlaylist
    );
  };

  get = async (): Promise<any[]> => {
    return await this.storageAdapter.getAll("smart_playlist", {});
  };
}
