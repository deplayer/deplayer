import { IMedia } from '../entities/Media'

export interface ScanStatus {
  scanning: boolean
  count: number
  lastScan: string
}

export interface IMusicProvider {
  providerKey: string;
  search(searchTerm: string): Promise<IMedia[]>;
  getArtistSongs?(artistName: string): Promise<IMedia[]>;
  getScanStatus?(): Promise<ScanStatus>;
  getNewestAlbumsSince?(sinceDate: string): Promise<IMedia[]>;
  getAlbumsBatch?(offset: number, size: number): Promise<{ media: IMedia[]; hasMore: boolean }>;
}