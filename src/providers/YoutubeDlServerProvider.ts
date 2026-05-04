import axios from "axios";

import { normalizeMedia, NormalizedMedia } from "../utils/normalizeMedia";
import { IMusicProvider } from "./IMusicProvider";

/**
 * It should implement the Subsonic API
 */
export default class YoutubeDlServerProvider implements IMusicProvider {
  baseUrl: string;
  searchUrl: string;
  providerKey: string;
  playUrl: string;

  constructor(settings: any, providerKey: string) {
    this.baseUrl = settings.host;
    this.providerKey = providerKey;
    this.searchUrl = `${settings.host}/api/info`;
    this.playUrl = `${settings.host}/api/play`;
  }

  mapSong = (songInfo: any): NormalizedMedia => {
    return normalizeMedia({
      title: songInfo.title,
      artistName: songInfo.artist,
      albumName: songInfo.album,
      cover: {
        thumbnailUrl: songInfo.thumbnails?.[0].url,
        fullUrl: songInfo.thumbnails?.[0].url,
      },
      genres: [],
      track: 0,
      filePath: "",
      type: "video",
      stream: {
        youtubedl: {
          service: this.providerKey,
          uris: [
            { uri: `${this.playUrl}?url=${escape(songInfo.webpage_url)}` },
          ],
        },
      },
    });
  };

  mapSongs = (info: any): NormalizedMedia[] => {
    if (info._type === "playlist") {
      return info.entries.map((entry: any) => {
        return this.mapSong(entry);
      });
    } else {
      return [this.mapSong(info)];
    }
  };

  search(searchTerm: string): Promise<NormalizedMedia[]> {
    return axios
      .get(`${this.searchUrl}?url=${escape(searchTerm)}`)
      .then((result) => {
        const response = result.data.info;
        return this.mapSongs(response);
      });
  }
}
