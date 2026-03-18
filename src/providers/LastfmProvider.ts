import { IMusicMetadataProvider } from "./IMusicMetadataProvider";
import axios from "axios";
import { createLogger } from "../utils/logger";

const logger = createLogger({ namespace: "LastfmProvider" });

export default class LastfmProvider implements IMusicMetadataProvider {
  baseUrl: string = "https://ws.audioscrobbler.com/2.0/";
  apikey: string;
  providerKey: string;
  enabled: boolean;
  artistInfoUrl: string;
  similarArtistsUrl: string;

  constructor(settings: any, providerKey: string) {
    this.providerKey = providerKey;
    this.enabled = settings.enabled;
    this.apikey = settings.apikey;
    this.artistInfoUrl = `${this.baseUrl}?method=artist.getinfo&api_key=${this.apikey}&format=json`;
    this.similarArtistsUrl = `${this.baseUrl}?method=artist.getsimilar&api_key=${this.apikey}&format=json&limit=20`;
  }

  searchArtistInfo(searchTerm: string): Promise<any> {
    if (!this.enabled) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      axios
        .get(`${this.artistInfoUrl}&artist=${searchTerm}`)
        .then((result) => {
          logger.info("lastfm result", result);
          resolve(result.data);
        })
        .catch((err) => {
          logger.error("Error fetching artist info:", err);
          reject(err);
        });
    });
  }

  searchSimilarArtists(artistName: string): Promise<string[]> {
    if (!this.enabled || !this.apikey) {
      return Promise.resolve([]);
    }

    return axios
      .get(`${this.similarArtistsUrl}&artist=${encodeURIComponent(artistName)}`)
      .then((result) => {
        const artists = result.data?.similarartists?.artist || [];
        return artists.map((a: any) => a.name as string);
      })
      .catch((err) => {
        logger.error("Error fetching similar artists:", err);
        return [];
      });
  }
}
