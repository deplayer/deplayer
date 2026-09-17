import axios from "axios";
import { createLogger } from "../utils/logger";

import { normalizeMedia, NormalizedMedia } from "../utils/normalizeMedia";
import { IMusicProvider } from "./IMusicProvider";
import type { HealthCheckResult } from "../types/providers";

type SubsonicAlbum = {
  id: string;
  name?: string;
  year?: number;
  created?: string;
  song?: SubsonicSong[];
};

type SubsonicSong = {
  id: string;
  title?: string;
  path?: string;
  artist?: string;
  album?: string;
  albumId?: string;
  coverArt?: string;
  genres?: Array<{ name: string }>;
  duration?: number;
  track?: number;
  discNumber?: number;
};

type SubsonicPingResponse = {
  status: "ok" | "failed";
  version?: string;
  error?: { code: number; message: string };
};

const logger = createLogger({ namespace: "SubsonicApiProvider" });

/**
 * Concurrent getAlbum requests per page. Page fetch time is dominated by
 * sequential round trips over the album details; 20 concurrent reads (up
 * from lockstep slices of 10) roughly halves the waves a 50-album page
 * needs while staying within what Subsonic servers tolerate.
 */
const ALBUM_FETCH_PARALLELISM = 20

/**
 * Implement the Subsonic API
 */
export default class SubsonicApiProvider implements IMusicProvider {
  baseUrl: string;
  user: string;
  password: string;
  albumSongsUrl: string;
  searchUrl: string;
  streamBase: string;
  coverBase: string;
  providerKey: string;

  constructor(settings: { baseUrl: string; user: string; password: string }, providerKey: string) {
    const appName = "deplayer";
    const songCount = 1000;
    const artistCount = 1000;
    this.baseUrl = settings.baseUrl;
    this.user = settings.user;
    this.password = settings.password;
    this.providerKey = providerKey;
    this.albumSongsUrl = `${settings.baseUrl}/rest/getMusicFolders.view?u=${settings.user}&p=${settings.password}&c=${appName}&v=1.11.0&f=json`;
    this.searchUrl = `${settings.baseUrl}/rest/search3.view?songCount=${songCount}&artistCount=${artistCount}&u=${settings.user}&p=${settings.password}&c=${appName}&v=1.11.0&f=json`;
    this.streamBase = `${settings.baseUrl}/rest/stream.view?u=${settings.user}&p=${settings.password}&c=${appName}&v=1.11.0`;
    this.coverBase = `${settings.baseUrl}/rest/getCoverArt.view?u=${settings.user}&p=${settings.password}&c=${appName}&v=1.11.0&f=json`;
  }

  mapSongs = (songs: SubsonicSong[], albums: SubsonicAlbum[] = []): NormalizedMedia[] => {
    // Protect against empty responses
    if (!songs) {
      return [];
    }

    const secureSongs = songs instanceof Array ? songs : [songs];
    return secureSongs.map((song: SubsonicSong) => {
      const album = albums.find((a) => a.id === song.albumId);

      return normalizeMedia({
        title: song.title ? song.title : song.path,
        artistName: song.artist,
        albumName: song.album,
        year: album?.year,
        cover: {
          thumbnailUrl: this.coverBase + "&id=" + song.coverArt + "&size=600",
          fullUrl: this.coverBase + "&id=" + song.coverArt,
        },
        genres: song.genres?.map((genre: { name: string }) => genre.name) || [],
        duration: song.duration !== undefined ? { value: song.duration, unit: 'seconds' } : undefined,
        track: song.track,
        discNumber: song.discNumber,
        filePath: song.path,
        type: "audio",
        stream: {
          subsonic: {
            service: this.providerKey,
            uris: [{ uri: this.streamBase + "&id=" + song.id }],
          },
        },
      });
    });
  };

  search(searchTerm: string): Promise<NormalizedMedia[]> {
    return new Promise((resolve, reject) => {
      axios
        .get(`${this.searchUrl}&query=${searchTerm}`)
        .then((result) => {
          const songs = result.data["subsonic-response"].searchResult3
            ? result.data["subsonic-response"].searchResult3.song
            : [];
          const albums = result.data["subsonic-response"].searchResult3
            ? result.data["subsonic-response"].searchResult3.album
            : [];
          resolve(this.mapSongs(songs, albums));
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  async *streamAlbumsSince(
    since: string | null,
    opts: { cursor?: number | null; pageSize?: number } = {},
  ): AsyncGenerator<{ media: NormalizedMedia[]; nextCursor: number | null; hasMore: boolean }, void, void> {
    const pageSize = opts.pageSize ?? 50
    const sinceMs = since ? new Date(since).getTime() : -Infinity

    /**
     * Fetch one album-list page (offset-based) and resolve its songs.
     * Pure fetch: no generator state, so it can run ahead of the consumer.
     */
    const fetchPage = async (offset: number): Promise<{
      media: NormalizedMedia[]
      hasMore: boolean
      nextOffset: number
    }> => {
      const list = await axios.get(
        `${this.baseUrl}/rest/getAlbumList2.view?u=${this.user}&p=${this.password}` +
        `&c=deplayer&v=1.16.1&f=json&type=newest&size=${pageSize}&offset=${offset}`,
      )
      const albums: SubsonicAlbum[] = list.data['subsonic-response'].albumList2?.album || []
      if (albums.length === 0) {
        return { media: [], hasMore: false, nextOffset: offset }
      }

      let crossedBoundary = false
      const fresh: SubsonicAlbum[] = []
      for (const album of albums) {
        // Missing `created` → treat as fresh (Infinity > anything). Protects
        // first-sync from stopping early on Subsonic servers that omit the
        // timestamp, and biases delta-sync toward over-including rather than
        // silently truncating.
        const createdMs = album.created ? new Date(album.created).getTime() : Infinity
        if (createdMs > sinceMs) {
          fresh.push(album)
        } else {
          crossedBoundary = true
          break
        }
      }

      // Bounded-concurrency detail fetch: a fixed pool of workers pulls album
      // ids off a shared cursor, so a slow request doesn't stall its whole
      // round the way lockstep slices did. Results are index-stable — page
      // media order always matches the server's album order.
      const details: { songs: SubsonicSong[]; album: SubsonicAlbum }[] = new Array(fresh.length)
      let next = 0
      const worker = async (): Promise<void> => {
        while (next < fresh.length) {
          const i = next++
          try {
            const detail = await axios.get(
              `${this.baseUrl}/rest/getAlbum.view?u=${this.user}&p=${this.password}` +
              `&c=deplayer&v=1.16.1&f=json&id=${fresh[i].id}`,
            )
            details[i] = {
              songs: detail.data['subsonic-response'].album?.song || [],
              album: fresh[i],
            }
          } catch (error) {
            logger.error(`Error fetching songs for album ${fresh[i].id}:`, error)
          }
        }
      }
      await Promise.all(
        Array.from({ length: Math.min(ALBUM_FETCH_PARALLELISM, fresh.length) }, worker),
      )

      const pageMedia: NormalizedMedia[] = []
      for (const d of details) {
        if (d) {
          for (const m of this.mapSongs(d.songs, [d.album])) pageMedia.push(m)
        }
      }

      const hasMore = !crossedBoundary && albums.length === pageSize
      return { media: pageMedia, hasMore, nextOffset: offset + pageSize }
    }

    // Prefetch pipeline: the next page's download starts BEFORE the current
    // page is yielded, so the consumer's commit overlaps the network instead
    // of serialising after it. A prefetch rejection surfaces at the next
    // `await pending` (same failure point as before); the no-op catch keeps
    // an abandoned generator from surfacing an unhandled rejection.
    const startFetch = (offset: number) => {
      const p = fetchPage(offset)
      p.catch(() => {})
      return p
    }

    const offset = opts.cursor ?? 0
    let pending = startFetch(offset)
    for (;;) {
      const page = await pending
      const next = page.hasMore ? startFetch(page.nextOffset) : null
      yield { media: page.media, nextCursor: page.hasMore ? page.nextOffset : null, hasMore: page.hasMore }
      if (next === null) return
      pending = next
    }
  }

  async getScanStatus(): Promise<{ scanning: boolean; count: number; lastScan: string }> {
    const result = await axios.get(
      `${this.baseUrl}/rest/getScanStatus.view?u=${this.user}&p=${this.password}&c=deplayer&v=1.16.1&f=json`
    )
    const status = result.data['subsonic-response'].scanStatus
    return {
      scanning: status.scanning,
      count: status.count,
      lastScan: status.lastScan,
    }
  }

  async getArtistSongs(artistName: string): Promise<NormalizedMedia[]> {
    try {
      // 1. Search for artist by name
      const searchResult = await axios.get(
        `${this.searchUrl}&query=${encodeURIComponent(artistName)}`
      );

      const artists =
        searchResult.data["subsonic-response"].searchResult3?.artist || [];

      // Find exact or closest match (case-insensitive)
      const artist =
        artists.find(
          (a: { name: string }) =>
            a.name.toLowerCase() === artistName.toLowerCase()
        ) || artists[0];

      if (!artist) {
        logger.debug(`Artist not found: ${artistName}`);
        return [];
      }

      // 2. Get artist details with albums
      const artistResult = await axios.get(
        `${this.baseUrl}/rest/getArtist.view?u=${this.user}&p=${this.password}&c=deplayer&v=1.11.0&f=json&id=${artist.id}`
      );

      const albums =
        artistResult.data["subsonic-response"].artist?.album || [];

      if (albums.length === 0) {
        logger.debug(`No albums found for artist: ${artistName}`);
        return [];
      }

      // 3. Get songs from each album
      const allSongs: NormalizedMedia[] = [];

      for (const album of albums) {
        try {
          const albumResult = await axios.get(
            `${this.baseUrl}/rest/getAlbum.view?u=${this.user}&p=${this.password}&c=deplayer&v=1.11.0&f=json&id=${album.id}`
          );

          const songs =
            albumResult.data["subsonic-response"].album?.song || [];
          const mappedSongs = this.mapSongs(songs, [album]);
          allSongs.push(...mappedSongs);
        } catch (error) {
          logger.error(`Error fetching album ${album.id}:`, error);
          // Continue with next album
        }
      }

      logger.debug(`Found ${allSongs.length} songs for artist: ${artistName}`);
      return allSongs;
    } catch (error) {
      logger.error(`Error fetching artist songs for ${artistName}:`, error);
      return [];
    }
  }

  async healthcheck(): Promise<HealthCheckResult> {
    const url = `${this.baseUrl}/rest/ping.view?u=${encodeURIComponent(this.user)}&p=${encodeURIComponent(this.password)}&c=deplayer&v=1.16.1&f=json`;
    const t0 = Date.now();
    try {
      const { data } = await axios.get(url, { timeout: 5000 });
      const r: SubsonicPingResponse | undefined = data?.["subsonic-response"];
      const checkedAt = Date.now();
      const latencyMs = checkedAt - t0;
      if (r?.status === "ok") {
        return { status: "connected", latencyMs, checkedAt };
      }
      if (r?.error?.code === 40) {
        return { status: "authFailed", error: r.error.message, checkedAt, latencyMs };
      }
      return { status: "unreachable", error: r?.error?.message ?? "Unknown", checkedAt, latencyMs };
    } catch (e) {
      const checkedAt = Date.now();
      return {
        status: "unreachable",
        error: e instanceof Error ? e.message : String(e),
        checkedAt,
        latencyMs: checkedAt - t0,
      };
    }
  }
}
