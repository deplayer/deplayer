import { NormalizedMedia } from '../utils/normalizeMedia'

export interface ScanStatus {
  scanning: boolean
  count: number
  lastScan: string
}

export interface AlbumPage {
  media: NormalizedMedia[]
  /**
   * Numeric offset for the next page. null when the stream is exhausted.
   * Kept as a number (not an opaque token) so SyncState.initialSyncCursor
   * can persist it without lossy coercion. Providers that need richer
   * resumption state should encode it elsewhere (e.g. another sync_state
   * column) rather than smuggle it through this field.
   */
  nextCursor: number | null
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
    opts?: { cursor?: number | null; pageSize?: number },
  ): AsyncGenerator<AlbumPage, void, void>
}
