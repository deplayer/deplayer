import axios from "axios";
import { createLogger } from "../utils/logger";

import { normalizeMedia, NormalizedMedia } from "../utils/normalizeMedia";
import { IMusicProvider } from "./IMusicProvider";

const logger = createLogger({ namespace: "SubsonicApiProvider" });

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

  constructor(settings: any, providerKey: string) {
    const appName = "deplayer";
    const songCount = 1000;
    const artistCount = 1000;
    this.baseUrl = settings.baseUrl;
    this.user = settings.user;
    this.password = settings.password;
    this.providerKey = providerKey;
    this.albumSongsUrl = `${settings.baseUrl}/rest/getMusicFolders.view?u=${settings.user}&p=${settings.password}&c=${appName}&v=1.11.0&f=json`;
    this.searchUrl = `${settings.baseUrl}/rest/search3.view?songCount=${songCount}&artistCount=${artistCount}&u=${settings.user}&p=${settings.password}&c=${appName}&v=1.11.0&f=json`;
    this.streamBase = `${settings.baseUrl}/rest/stream.view?u=${settings.user}&p=${settings.password}&c=${appName}&v=1.11.0&f=json`;
    this.coverBase = `${settings.baseUrl}/rest/getCoverArt.view?u=${settings.user}&p=${settings.password}&c=${appName}&v=1.11.0&f=json`;
  }

  mapSongs = (songs: any[], albums: any[] = []): NormalizedMedia[] => {
    // Protect against empty responses
    if (!songs) {
      return [];
    }

    const secureSongs = songs instanceof Array ? songs : [songs];
    return secureSongs.map((song: any) => {
      const album = albums.find((album) => album.id === song.album.id);

      return normalizeMedia({
        title: song.title ? song.title : song.path,
        artistName: song.artist,
        albumName: song.album,
        year: album?.year,
        cover: {
          thumbnailUrl: this.coverBase + "&id=" + song.coverArt + "&size=100",
          fullUrl: this.coverBase + "&id=" + song.coverArt,
        },
        genres: song.genres?.map((genre: { name: string }) => genre.name) || [],
        duration: { value: song.duration, unit: 'seconds' },
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

  async getNewestAlbumsSince(sinceDate: string): Promise<NormalizedMedia[]> {
    const PAGE_SIZE = 50
    const BATCH_SIZE = 10
    const allSongs: NormalizedMedia[] = []
    let offset = 0
    let done = false

    while (!done) {
      const result = await axios.get(
        `${this.baseUrl}/rest/getAlbumList2.view?u=${this.user}&p=${this.password}&c=deplayer&v=1.16.1&f=json&type=newest&size=${PAGE_SIZE}&offset=${offset}`
      )
      const albums = result.data['subsonic-response'].albumList2?.album || []

      if (albums.length === 0) {
        done = true
        break
      }

      const newAlbums = []
      for (const album of albums) {
        if (new Date(album.created) > new Date(sinceDate)) {
          newAlbums.push(album)
        } else {
          done = true
          break
        }
      }

      // Fetch songs for new albums in parallel batches
      for (let i = 0; i < newAlbums.length; i += BATCH_SIZE) {
        const batch = newAlbums.slice(i, i + BATCH_SIZE)
        const batchResults = await Promise.allSettled(
          batch.map(async (album: any) => {
            const albumDetails = await axios.get(
              `${this.baseUrl}/rest/getAlbum.view?u=${this.user}&p=${this.password}&c=deplayer&v=1.16.1&f=json&id=${album.id}`
            )
            const songs = albumDetails.data['subsonic-response'].album?.song || []
            return { songs, album }
          })
        )

        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            allSongs.push(...this.mapSongs(result.value.songs, [result.value.album]))
          } else {
            logger.error('Error fetching album songs:', result.reason)
          }
        }
      }

      if (!done) {
        offset += PAGE_SIZE
      }
    }

    return allSongs
  }

  async getAlbumsBatch(offset: number, size: number): Promise<{ media: NormalizedMedia[]; hasMore: boolean }> {
    const BATCH_SIZE = 10
    const result = await axios.get(
      `${this.baseUrl}/rest/getAlbumList2.view?u=${this.user}&p=${this.password}&c=deplayer&v=1.16.1&f=json&type=newest&size=${size}&offset=${offset}`
    )
    const albums = result.data['subsonic-response'].albumList2?.album || []
    const allSongs: NormalizedMedia[] = []

    for (let i = 0; i < albums.length; i += BATCH_SIZE) {
      const batch = albums.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.allSettled(
        batch.map(async (album: any) => {
          const albumDetails = await axios.get(
            `${this.baseUrl}/rest/getAlbum.view?u=${this.user}&p=${this.password}&c=deplayer&v=1.16.1&f=json&id=${album.id}`
          )
          const songs = albumDetails.data['subsonic-response'].album?.song || []
          return { songs, album }
        })
      )
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          allSongs.push(...this.mapSongs(result.value.songs, [result.value.album]))
        }
      }
    }

    return { media: allSongs, hasMore: albums.length === size }
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
}
