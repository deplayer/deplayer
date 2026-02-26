import { Api, Jellyfin } from "@jellyfin/sdk";
import { ItemFields } from "@jellyfin/sdk/lib/generated-client/models";
import { getItemsApi } from "@jellyfin/sdk/lib/utils/api/items-api";
import { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
import Media from "../entities/Media";
import { IMusicProvider } from "./IMusicProvider";
import { createLogger } from "../utils/logger";

const logger = createLogger({ namespace: "JellyfinProvider" });

export default class JellyfinProvider implements IMusicProvider {
  private api: Api;
  private baseUrl: string;
  private apiKey: string;
  private username: string;
  private password: string;
  public providerKey: string;
  private userId: string | null = null;

  constructor(settings: any, providerKey: string) {
    this.baseUrl = settings.baseUrl.replace(/\/$/, "");
    this.apiKey = settings.apiKey;
    this.username = settings.username;
    this.password = settings.password;
    this.providerKey = providerKey;

    const jellyfin = new Jellyfin({
      clientInfo: {
        name: "Deplayer",
        version: "1.0.0",
      },
      deviceInfo: {
        name: "Browser",
        id: "browser",
      },
    });

    this.api = jellyfin.createApi(this.baseUrl, this.apiKey);
  }

  public async initialize(): Promise<void> {
    try {
      const auth = await this.api.authenticateUserByName(
        this.username,
        this.password
      );

      if (!auth.data.AccessToken) {
        throw new Error("Failed to authenticate with Jellyfin server");
      }

      const users = await getUserApi(this.api).getUsers();

      this.userId =
        users.data.find((user) => user.Name === this.username)?.Id || null;
    } catch (error) {
      logger.error("Jellyfin authentication error:", error);
      throw new Error("Failed to authenticate with Jellyfin server");
    }
  }

  private mapSongs(items: any[]): Array<Media> {
    return items.map((item) => {
      const type = item.Type?.toLowerCase() === "movie" ? "video" : "audio";

      const artistName =
        type === "video"
          ? item.Studios?.[0]?.Name || "Unknown Studio"
          : item.AlbumArtist || "Unknown Artist";
      const albumName =
        type === "video" ? "Movies" : item.Album || "Unknown Album";

      return new Media({
        title: item.Name,
        artistName: artistName,
        albumName: albumName,
        artist: { name: artistName },
        album: {
          name: albumName,
          artist: { name: artistName },
        },
        track: item.IndexNumber || null,
        discNumber: item.ParentIndexNumber || null,
        cover: {
          thumbnailUrl: `${this.baseUrl}/Items/${item.Id}/Images/Primary?maxHeight=250&api_key=${this.apiKey}`,
          fullUrl: `${this.baseUrl}/Items/${item.Id}/Images/Primary?api_key=${this.apiKey}`,
        },
        genres: item.Genres || [],
        duration: Math.floor((item.RunTimeTicks || 0) / 10000),
        type: type,
        stream: {
          jellyfin: {
            service: this.providerKey,
            uris: [
              {
                uri:
                  type === "video"
                    ? `${this.baseUrl}/Videos/${item.Id}/stream?static=true&api_key=${this.apiKey}&userId=${this.userId}&audioCodec=aac&audioBitrate=192000&audioSampleRate=44100`
                    : `${this.baseUrl}/Audio/${item.Id}/stream?static=true&api_key=${this.apiKey}&userId=${this.userId}`,
              },
            ],
          },
        },
      });
    });
  }

  async search(searchTerm: string): Promise<Array<Media>> {
    await this.initialize();

    if (!this.userId) {
      throw new Error("User ID not found");
    }

    try {
      let allItems: any[] = [];
      let startIndex = 0;
      const limit = 100;

      while (true) {
        const results = await getItemsApi(this.api).getItems({
          userId: this.userId,
          searchTerm,
          includeItemTypes: [
            "Audio",
            "Movie",
            "Episode",
            "MusicVideo",
            "Series",
            "MusicAlbum",
            "MusicArtist",
            "MusicGenre",
          ],
          recursive: true,
          fields: [
            ItemFields.Path,
            ItemFields.Genres,
            ItemFields.Studios,
            ItemFields.ParentId,
          ] as ItemFields[],
          limit,
          startIndex,
        });

        const items = results.data.Items || [];
        if (items.length === 0) break;

        allItems = allItems.concat(items);
        startIndex += limit;

        if (items.length < limit) break;
      }

      return this.mapSongs(allItems);
    } catch (error) {
      logger.error("Jellyfin search error:", error);
      throw new Error("Failed to search Jellyfin server");
    }
  }

  async fullSync(): Promise<Array<any>> {
    await this.initialize();

    if (!this.userId) {
      throw new Error("User ID not found");
    }

    try {
      const results = await getItemsApi(this.api).getItems({
        userId: this.userId,
        includeItemTypes: ["Audio", "Movie"],
        recursive: true,
        fields: [
          ItemFields.Path,
          ItemFields.Genres,
          ItemFields.Studios,
          ItemFields.ParentId,
        ] as ItemFields[],
        limit: 10000, // Adjust as needed
      });

      return this.mapSongs(results.data.Items || []);
    } catch (error) {
      logger.error("Jellyfin sync error:", error);
      throw error;
    }
  }

  async getArtistSongs(artistName: string): Promise<Array<Media>> {
    await this.initialize();

    if (!this.userId) {
      throw new Error("User ID not found");
    }

    try {
      // Search for all audio items and filter by artist name
      const results = await getItemsApi(this.api).getItems({
        userId: this.userId,
        searchTerm: artistName,
        includeItemTypes: ["Audio"],
        recursive: true,
        fields: [
          ItemFields.Path,
          ItemFields.Genres,
          ItemFields.Studios,
          ItemFields.ParentId,
        ] as ItemFields[],
        limit: 10000,
      });

      const items = results.data.Items || [];

      // Filter to only include songs where artist matches (case-insensitive)
      const artistItems = items.filter((item: any) => {
        const itemArtist = item.AlbumArtist || item.Artists?.[0] || "";
        return itemArtist.toLowerCase() === artistName.toLowerCase();
      });

      logger.debug(
        `Found ${artistItems.length} songs for artist: ${artistName}`
      );
      return this.mapSongs(artistItems);
    } catch (error) {
      logger.error(`Error fetching artist songs for ${artistName}:`, error);
      return [];
    }
  }
}
