import axios from "axios";
import type { MediaRow } from "../types/media";
import { createLogger } from "../utils/logger";

const logger = createLogger({ namespace: "LyricsovhProvider" });

export default class LyricsovhProvider {
  async searchLyrics(song: MediaRow): Promise<{ lyrics: string }> {
    const baseUrl = "https://api.lyrics.ovh/v1";
    const artist = encodeURIComponent(song.artistName);
    const title = encodeURIComponent(song.title);

    logger.info("Fetching lyrics for:", { artist, title });

    try {
      const response = await axios.get(`${baseUrl}/${artist}/${title}`);
      logger.debug("API Response:", response.data);

      // Validate response format
      if (!response.data || !response.data.lyrics) {
        throw new Error("Invalid lyrics response format");
      }

      return response.data;
    } catch (error: unknown) {
      // Handle specific error cases
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response) {
        if (axiosError.response.status === 404) {
          throw new Error("Lyrics not found");
        }
        throw new Error(`API error: ${axiosError.response.status}`);
      }
      logger.error("Error fetching lyrics:", error);
      throw error;
    }
  }
}
