import { NormalizedMedia } from '../utils/normalizeMedia'

export interface ScanStatus {
  scanning: boolean
  count: number
  lastScan: string
}

export interface IMusicProvider {
  providerKey: string;
  search(searchTerm: string): Promise<NormalizedMedia[]>;
  getArtistSongs?(artistName: string): Promise<NormalizedMedia[]>;
  getScanStatus?(): Promise<ScanStatus>;
  getNewestAlbumsSince?(sinceDate: string): Promise<NormalizedMedia[]>;
  getAlbumsBatch?(offset: number, size: number): Promise<{ media: NormalizedMedia[]; hasMore: boolean }>;
}