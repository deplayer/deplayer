import Webtorrent, { Torrent, TorrentFile } from "webtorrent";
import { createLogger } from "../../utils/logger";

import type { MediaRow } from "../../types/media";

const logger = createLogger({ namespace: "WebtorrentService" });

const announceList = [
  "wss://tracker.btorrent.xyz",
  "udp://tracker.openbittorrent.com:80",
  "udp://tracker.internetwarriors.net:1337",
  "udp://tracker.leechers-paradise.org:6969",
  "udp://tracker.coppersurfer.tk:6969",
  "udp://exodus.desync.com:6969",
  "wss://tracker.openwebtorrent.com",
];

const videoExtensions = [".mp4", ".mkv"];
const audioExtensions = [".mp3"];

export const magnetToMedia = async (
  torrentUrl: string
): Promise<Array<MediaRow>> => {
  const client = new Webtorrent();

  return new Promise((resolve): void => {
    logger.info("adding: ", torrentUrl);

    client.add(
      torrentUrl,
      {
        announce: announceList,
      },
      (torrent: Torrent) => {
        logger.debug("files detected: ", torrent.files);
        const files = torrent.files.filter((file: TorrentFile) => {
          return [...videoExtensions, ...audioExtensions].some((ext) =>
            file.name.endsWith(ext)
          );
        });

        const medias: MediaRow[] = files.map((file: TorrentFile) => {
          const type = videoExtensions.some((ext) => file.name.endsWith(ext))
            ? "video"
            : "audio";
          return {
            id: `webtorrent-${file.name}`,
            title: file.name,
            artistId: "webtorrent",
            albumId: "webtorrent",
            artistName: "webtorrent",
            albumName: "webtorrent",
            type: type as 'audio' | 'video',
            duration: 0,
            playCount: 0,
            track: null,
            discNumber: null,
            stream: {
              webtorrent: {
                service: "webtorrent",
                uris: [{ uri: torrentUrl }],
              },
            },
            cover: null,
            genres: [],
            externalId: null,
            shareUrl: null,
            filePath: null,
            genresFlat: "",
            providersFlat: "webtorrent",
          };
        });

        return resolve(medias);
      }
    );
  });
};
