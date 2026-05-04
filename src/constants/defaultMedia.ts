import type { MediaRow } from "../types/media";

const defaultMedia: MediaRow = {
  id: "winamp-demo",
  title: "Winamp Demo Song",
  type: "audio",
  artistId: "winamp",
  albumId: "winamp-demo",
  artistName: "Winamp",
  albumName: "Demo",
  genres: ["Electronic"],
  duration: 0,
  stream: {
    url: {
      service: "url",
      uris: [{ uri: "https://archive.org/download/winamp-demo/DEMO.mp3" }],
    },
  },
  playCount: 0,
  track: null,
  discNumber: null,
  cover: null,
  externalId: null,
  shareUrl: null,
  filePath: null,
  genresFlat: "Electronic",
  providersFlat: "url",
};

export default defaultMedia;
