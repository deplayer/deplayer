import axios from "axios";
import { createLogger } from "../utils/logger";

import Media, { IMedia } from "../entities/Media";
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

  mapSongs = (songs: IMedia[], albums: any[] = []): Array<any> => {
    // Protect against empty responses
    if (!songs) {
      return [];
    }

    const secureSongs = songs instanceof Array ? songs : [songs];
    return secureSongs.map((song: any) => {
      const album = albums.find((album) => album.id === song.album.id);

      return new Media({
        title: song.title ? song.title : song.path,
        artist: { name: song.artist },
        artistName: song.artist,
        album: { name: song.album, artist: { name: song.artist } },
        year: album?.year,
        albumName: song.album,
        cover: {
          thumbnailUrl: this.coverBase + "&id=" + song.coverArt,
          fullUrl: this.coverBase + "&id=" + song.coverArt,
        },
        genres: song.genres.map((genre: { name: string }) => genre.name),
        duration: song.duration * 1000,
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

  search(searchTerm: string): Promise<Array<IMedia>> {
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

  async fullSync(): Promise<Array<any>> {
    try {
      // Request a large number of albums to ensure we get all of them
      // Subsonic default is 500, we'll request 10000 to be safe
      const result = await axios.get(
        `${this.baseUrl}/rest/getAlbumList2.view?u=${this.user}&p=${this.password}&c=deplayer&v=1.11.0&f=json&type=alphabeticalByName&size=10000`
      );
      const albums = result.data["subsonic-response"].albumList2.album;

      const allSongs = [];

      for (const album of albums) {
        const albumDetails = await axios.get(
          `${this.baseUrl}/rest/getAlbum.view?u=${this.user}&p=${this.password}&c=deplayer&v=1.11.0&f=json&id=${album.id}`
        );
        const songs = albumDetails.data["subsonic-response"].album.song;
        allSongs.push(...this.mapSongs(songs, [album]));
      }

      return allSongs;
    } catch (error) {
      logger.error("Error during full sync:", error);
      throw error;
    }
  }

  async getRecentMedia(): Promise<IMedia[]> {
    try {
      // Get recently added media items
      const result = await axios.get(
        `${this.baseUrl}/rest/getAlbumList2.view?u=${this.user}&p=${this.password}&c=deplayer&v=1.11.0&f=json&type=newest&size=50`
      );

      const albums = result.data["subsonic-response"].albumList2.album || [];
      const allSongs: IMedia[] = [];

      // For each album, get its songs
      for (const album of albums) {
        try {
          const albumDetails = await axios.get(
            `${this.baseUrl}/rest/getAlbum.view?u=${this.user}&p=${this.password}&c=deplayer&v=1.11.0&f=json&id=${album.id}`
          );

          const songs = albumDetails.data["subsonic-response"].album.song || [];
          // Map songs with album information
          const mappedSongs = this.mapSongs(songs, [album]);
          allSongs.push(...mappedSongs);
        } catch (error) {
          logger.error(`Error fetching songs for album ${album.id}:`, error);
          // Continue with next album even if one fails
          continue;
        }
      }

      return allSongs;
    } catch (error) {
      logger.error("Error fetching recent media:", error);
      return [];
    }
  }

  async getArtistSongs(artistName: string): Promise<IMedia[]> {
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
      const allSongs: IMedia[] = [];

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
