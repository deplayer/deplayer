import { IStorageService } from "./IStorageService";
import { IAdapter } from "./database/IAdapter";

interface Room {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const MODEL = "room";

export default class RoomStorageService implements IStorageService {
  storageAdapter: IAdapter;

  constructor(storageAdapter: IAdapter) {
    this.storageAdapter = storageAdapter;
  }

  initialize = async (): Promise<void> => {
    await this.storageAdapter.initialize(MODEL);
  };

  get = async (): Promise<Room[]> => {
    return await this.storageAdapter.getAll(MODEL, {});
  };

  save = async (id: string): Promise<any> => {
    return await this.storageAdapter.save(MODEL, id, {
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  };

  remove = async (id: string): Promise<void> => {
    console.log("Removing room:", id);

    await this.storageAdapter.removeMany(MODEL, [id]);
  };

  removeAll = async (): Promise<any> => {
    return await this.storageAdapter.removeCollection(MODEL);
  };
} 