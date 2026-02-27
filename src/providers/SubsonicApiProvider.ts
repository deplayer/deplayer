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
    
    // DEBUG: Time individual parts
    let mediaCreationTime = 0
    let dataPreparationTime = 0
    
    const result = secureSongs.map((song: any) => {
      const t0 = performance.now()
      
      const album = albums.find((album) => album.id === song.album.id);
      const mediaParams = {
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
        genres: song.genres?.map((genre: { name: string }) => genre.name) || [],
        duration: song.duration * 1000,
        track: song.track,
        discNumber: song.discNumber,
        filePath: song.path,
        type: "audio" as const,
        stream: {
          subsonic: {
            service: this.providerKey,
            uris: [{ uri: this.streamBase + "&id=" + song.id }],
          },
        },
      }
      
      const t1 = performance.now()
      dataPreparationTime += (t1 - t0)
      
      const media = new Media(mediaParams);
      
      const t2 = performance.now()
      mediaCreationTime += (t2 - t1)
      
      return media
    });
    
    if (secureSongs.length > 0) {
      console.log(`[Subsonic PERF] mapSongs(${secureSongs.length}): dataPrep=${dataPreparationTime.toFixed(2)}ms, mediaCreation=${mediaCreationTime.toFixed(2)}ms, avg=${(mediaCreationTime/secureSongs.length).toFixed(2)}ms/song`)
    }
    
    return result
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
    const perfLog = (label: string, startTime?: number) => {
      const now = performance.now()
      if (startTime !== undefined) {
        console.log(`[Subsonic PERF] ${label}: ${(now - startTime).toFixed(2)}ms`)
      }
      return now
    }
    
    try {
      const t0 = perfLog('getRecentMedia START')
      
      // Get recently added media items
      const result = await axios.get(
        `${this.baseUrl}/rest/getAlbumList2.view?u=${this.user}&p=${this.password}&c=deplayer&v=1.11.0&f=json&type=newest&size=50`
      );
      perfLog('Album list fetched', t0)

      const albums = result.data["subsonic-response"].albumList2.album || [];
      console.log(`[Subsonic PERF] Albums to fetch: ${albums.length}`)
      
      // PERF FIX: Fetch album details in parallel batches instead of sequentially
      const BATCH_SIZE = 10
      const allRawSongs: any[][] = []
      
      const t1 = performance.now()
      for (let i = 0; i < albums.length; i += BATCH_SIZE) {
        const batchStart = performance.now()
        const batch = albums.slice(i, i + BATCH_SIZE)
        
        // Fetch all albums in this batch in parallel
        const batchResults = await Promise.allSettled(
          batch.map(async (album: any) => {
            const albumDetails = await axios.get(
              `${this.baseUrl}/rest/getAlbum.view?u=${this.user}&p=${this.password}&c=deplayer&v=1.11.0&f=json&id=${album.id}`
            )
            const songs = albumDetails.data["subsonic-response"].album.song || []
            return { songs, album }
          })
        )
        
        // Collect successful results
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            allRawSongs.push([result.value.songs, result.value.album])
          }
        }
        
        console.log(`[Subsonic PERF] Network batch ${i/BATCH_SIZE}: ${(performance.now() - batchStart).toFixed(2)}ms`)
        
        // Yield to main thread between network batches
        if (i + BATCH_SIZE < albums.length) {
          await new Promise(resolve => requestAnimationFrame(resolve))
        }
      }
      perfLog('All network requests done', t1)
      
      // Count total songs
      let totalSongs = 0
      for (const [songs] of allRawSongs) {
        totalSongs += songs?.length || 0
      }
      console.log(`[Subsonic PERF] Total songs to process: ${totalSongs}`)
      
      // Process mapSongs in chunks
      const PROCESS_BATCH_SIZE = 5
      const allSongs: IMedia[] = []
      
      const t2 = performance.now()
      for (let i = 0; i < allRawSongs.length; i += PROCESS_BATCH_SIZE) {
        const processBatchStart = performance.now()
        const processBatch = allRawSongs.slice(i, i + PROCESS_BATCH_SIZE)
        
        let songsInBatch = 0
        for (const [songs, album] of processBatch) {
          songsInBatch += songs?.length || 0
          const mappedSongs = this.mapSongs(songs, [album])
          allSongs.push(...mappedSongs)
        }
        
        console.log(`[Subsonic PERF] Process batch ${i/PROCESS_BATCH_SIZE} (${songsInBatch} songs): ${(performance.now() - processBatchStart).toFixed(2)}ms`)
        
        // Yield to main thread between processing batches
        if (i + PROCESS_BATCH_SIZE < allRawSongs.length) {
          await new Promise(resolve => requestAnimationFrame(resolve))
        }
      }
      perfLog('All processing done', t2)
      perfLog('getRecentMedia TOTAL', t0)

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
