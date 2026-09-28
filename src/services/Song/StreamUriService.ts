import type { MediaRow } from "../../types/media";
import { get } from "idb-keyval";
import { readFile } from "@happy-js/happy-opfs";
import { verifyPermission } from "../FileSystemService";
import { createLogger } from "../../utils/logger";

const logger = createLogger({ namespace: "StreamUriService" });

/**
 * Stream source — a resolved play target. Blob-kind URLs are object URLs
 * over local files (OPFS File / filesystem File — no in-memory copy); the
 * service owns them and releaseStreamSource must be called when playback
 * moves on. Remote URLs need no release.
 */
export interface StreamSource {
  url: string;
  kind: "remote" | "blob";
}

/** Release a source's backing blob. No-op for remote sources; safe to call twice. */
export function releaseStreamSource(source: StreamSource | null | undefined): void {
  if (source && source.kind === "blob") {
    URL.revokeObjectURL(source.url);
  }
}

/**
 * Strip `f=json` from a remote stream URI.
 *
 * Legacy persisted rows carry `f=json` on stream.view URIs (from before the
 * provider stopped appending it); Subsonic then answers the audio element
 * with application/json and no decoder exists. Apply wherever a stored
 * remote URI is consumed.
 */
export function sanitizeStreamUri(uri: string): string {
  if (!uri.includes("f=json")) return uri;
  return (
    uri
      .replace(/&f=json&/, "&")
      .replace(/&f=json$/, "")
      .replace(/\?f=json&/, "?")
      .replace(/\?f=json$/, "")
  );
}

async function handleOpfs(streamUri: string | null): Promise<StreamSource> {
  if (!streamUri) {
    return { url: "", kind: "remote" };
  }

  logger.debug("Starting OPFS reading");

  const fixedStreamUri = streamUri?.replace("opfs://", "/");

  // Zero-copy: the native File references OPFS storage directly, so the
  // audio element streams from disk. The previous binary read materialized
  // the whole track as an ArrayBuffer and copied it again into a Blob —
  // two full-file copies in JS per resolution, on every play/next/prev and
  // on every SongView provider refresh, which janked the main thread.
  const file = await readFile(fixedStreamUri, { encoding: "blob" });

  return { url: URL.createObjectURL(file.unwrap()), kind: "blob" };
}

async function handleFilesystem(streamUri: string | null): Promise<StreamSource> {
  logger.debug("Processing filesystem streamUri", streamUri);
  const directoryHandler = await get("directoryHandler");
  await verifyPermission(directoryHandler);

  logger.debug("directoryHandler", directoryHandler);

  if (!streamUri) {
    return { url: "", kind: "remote" };
  }

  const handler = await get(streamUri);

  if (handler instanceof File) {
    logger.debug("handler is a File", handler);

    return { url: URL.createObjectURL(handler), kind: "blob" };
  }

  if (!handler.getFile) {
    return { url: streamUri, kind: "remote" };
  }

  logger.debug("Verifying file permission");
  await verifyPermission(handler);

  logger.debug("Getting file from handler", handler);
  const file = await handler.getFile();

  logger.debug("file", file);
  if (!file) {
    return { url: streamUri, kind: "remote" };
  }

  return { url: URL.createObjectURL(file), kind: "blob" };
}

/**
 * Resolve the stream source for `song` from its `providerNum`-th provider.
 * Blob-kind sources pin the local file via its object URL until releaseStreamSource.
 */
export const getStreamUri = async (
  song: MediaRow,
  providerNum: number
): Promise<StreamSource> => {
  const entry = Object.values(song.stream)[providerNum];

  if (!entry || !entry.service) {
    return { url: "", kind: "remote" };
  }

  const streamUri = entry.uris[0].uri;

  if (entry.service === "filesystem") {
    return await handleFilesystem(streamUri);
  }

  if (entry.service === "opfs") {
    return await handleOpfs(streamUri);
  }

  return { url: streamUri ? sanitizeStreamUri(streamUri) : "", kind: "remote" };
};
