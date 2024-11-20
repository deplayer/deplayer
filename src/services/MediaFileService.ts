import axios from 'axios';
import { readFile } from '@happy-js/happy-opfs';
import { get } from 'idb-keyval';
import { IMedia, hasAnyProviderOf } from '../entities/Media';
import { verifyPermission } from './FileSystemService'

export class MediaFileService {
  /**
   * Gets a File object from an IMedia, handling different stream sources
   */
  static async getMediaFile(media: IMedia): Promise<File | Blob | null> {
    if (hasAnyProviderOf(media, ["opfs"])) {
      return await this.handleOpfsMedia(media);
    }

    if (hasAnyProviderOf(media, ["filesystem"])) {
      return await this.handleFilesystemMedia(media);
    }

    return await this.handleRemoteMedia(media);
  }

  private static async handleOpfsMedia(media: IMedia): Promise<Blob | null> {
    const songFsUri = `/${media.id}`;
    try {
      const file = await readFile(songFsUri);
      return new Blob([file.unwrap()]);
    } catch (error) {
      console.error('Error reading from OPFS:', error);
      return null;
    }
  }

  private static async handleFilesystemMedia(media: IMedia): Promise<File | null> {
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
      console.error('Error reading from filesystem:', error);
      return null;
    }
  }

  private static async handleRemoteMedia(media: IMedia): Promise<Blob | null> {
    const streamUrl = Object.values(media.stream)[0].uris[0].uri;
    if (!streamUrl) {
      console.error('No stream URL found for media', media);
      return null;
    }

    try {
      const response = await axios.get(streamUrl, { responseType: 'blob' });
      return response.data;
    } catch (error) {
      console.error('Error fetching remote media:', error);
      return null;
    }
  }
} 