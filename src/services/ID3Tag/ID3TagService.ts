import * as musicMetadata from "music-metadata";
import { writeFile } from "@happy-js/happy-opfs";
import { createLogger } from "../../utils/logger";

import { normalizeMedia, NormalizedMedia } from "../../utils/normalizeMedia";
import type { Cover } from "../../types/media";

const logger = createLogger({ namespace: "ID3TagService" });

function generateHexHash(length: number = 16): string {
  let hash = "";
  for (let i = 0; i < length; i++) {
    hash += Math.floor(Math.random() * 16).toString(16);
  }
  return hash;
}

const SUPPORTED_MIME_TYPES = [
  "audio/mpeg", // MP3
  "audio/mp4", // M4A, AAC
  "audio/ogg", // OGG
  "audio/wav", // WAV
  "audio/flac", // FLAC
  "audio/x-flac", // FLAC (alternative)
  "audio/webm", // WEBM
  "video/mp4", // MP4
  "video/webm", // WEBM video
];

export const readFileMetadata = async (file: any) => {
  const normFile = file.contents ? file.contents : file;

  // Check if file type is supported
  if (!normFile.type || !SUPPORTED_MIME_TYPES.includes(normFile.type)) {
    throw new Error(
      `Unsupported file type: ${
        normFile.type || "unknown"
      }. Supported types are: ${SUPPORTED_MIME_TYPES.join(", ")}`
    );
  }

  logger.debug("Reading metadata from file:", normFile);

  try {
    const metadata = await musicMetadata.parseBlob(normFile);
    logger.debug("File metadata:", metadata);
    logger.debug("Metadata genre:", metadata.common.genre);
    return metadata;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to parse metadata: ${message}`);
  }
};

export async function metadataToSong(
  metadata: musicMetadata.IAudioMetadata,
  fileUri: string,
  service: string
): Promise<NormalizedMedia> {
  const cover = metadata.common.picture ? metadata.common.picture[0] : null;

  logger.debug("metadata.common.genre: ", metadata.common.genre);

  let mediaCover: Cover | null = null;

  if (cover?.data) {
    const fileName = generateHexHash(10);
    const coverFs = `/opfs-${fileName}.jpeg`;
    await writeFile(coverFs, cover.data);
    mediaCover = { thumbnailUrl: coverFs, fullUrl: coverFs };
  }

  return normalizeMedia({
    title: metadata.common.title || fileUri,
    artistName: metadata.common.artist || "",
    albumName: metadata.common.album || "",
    type: fileUri.endsWith(".mp4") ? "video" : "audio",
    duration: { value: metadata.format.duration || 0, unit: 'seconds' },
    genres: metadata.common.genre ?? [],
    track: metadata.common.track.no || 0,
    cover: mediaCover,
    stream: {
      filesystem: {
        service: service,
        uris: [
          {
            uri: fileUri,
          },
        ],
      },
    },
  });
}
