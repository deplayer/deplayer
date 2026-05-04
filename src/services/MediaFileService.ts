import axios from "axios";
import { readFile } from "@happy-js/happy-opfs";
import { get } from "idb-keyval";
import type { MediaRow } from "../types/media";
import { hasAnyProviderOf } from "../utils/hasAnyProviderOf";
import { verifyPermission } from "./FileSystemService";
import { createLogger } from "../utils/logger";

const logger = createLogger({ namespace: "MediaFileService" });

export class MediaFileService {
  /**
   * Gets a File object from an MediaRow, handling different stream sources
   */
  static async getMediaFile(media: MediaRow): Promise<File | Blob | null> {
    if (hasAnyProviderOf(media.stream, ["opfs"])) {
      return await this.handleOpfsMedia(media);
    }

    if (hasAnyProviderOf(media.stream, ["filesystem"])) {
      return await this.handleFilesystemMedia(media);
    }

    return await this.handleRemoteMedia(media);
  }

  private static async handleOpfsMedia(media: MediaRow): Promise<Blob | null> {
    const songFsUri = `/${media.id}`;
    try {
      const file = await readFile(songFsUri);
      return new Blob([file.unwrap()]);
    } catch (error) {
      logger.error("Error reading from OPFS:", error);
      return null;
    }
  }

  private static async handleFilesystemMedia(
    media: MediaRow
  ): Promise<File | null> {
    const streamUri = Object.values(media.stream)[0].uris[0].uri;
    try {
      const handler = await get(streamUri);

      if (handler instanceof File) {
        return handler;
      }

      if (!handler?.getFile) {
        return null;
      }

      await verifyPermission(handler);
      return await handler.getFile();
    } catch (error) {
      logger.error("Error reading from filesystem:", error);
      return null;
    }
  }

  private static async handleRemoteMedia(media: MediaRow): Promise<Blob | null> {
    const streamUrl = Object.values(media.stream)[0].uris[0].uri;
    if (!streamUrl) {
      logger.error("No stream URL found for media", media);
      return null;
    }

    try {
      const response = await axios.get(streamUrl, { responseType: "blob" });
      return response.data;
    } catch (error) {
      logger.error("Error fetching remote media:", error);
      return null;
    }
  }
}
