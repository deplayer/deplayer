import { IMedia } from '../entities/Media'

export interface IMusicProvider {
  providerKey: string;
  search(searchTerm: string): Promise<IMedia[]>;
  fullSync?(): Promise<IMedia[]>;
  getRecentMedia?(): Promise<IMedia[]>;
}