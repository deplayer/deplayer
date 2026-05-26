import { NormalizedMedia } from '../utils/normalizeMedia'

export interface ScanStatus {
  scanning: boolean
  count: number
  lastScan: string
}

export interface AlbumPage {
  media: NormalizedMedia[]
  /** Opaque cursor for the next page (provider-specific). null when done. */
  nextCursor: string | null
  hasMore: boolean
}

export interface IMusicProvider {
  providerKey: string
  search(searchTerm: string): Promise<NormalizedMedia[]>
  getArtistSongs?(artistName: string): Promise<NormalizedMedia[]>
  getScanStatus?(): Promise<ScanStatus>
  /**
   * Stream album pages newer than `since`. Pass `null` for a first sync.
   * `cursor` resumes from a previous session's saved position.
   */
  streamAlbumsSince?(
    since: string | null,
    opts?: { cursor?: string | null; pageSize?: number },
  ): AsyncGenerator<AlbumPage, void, void>
}
