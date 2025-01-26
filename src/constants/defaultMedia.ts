import Media from "../entities/Media";

const defaultMedia = new Media({
  id: "winamp-demo",
  title: "Winamp Demo Song",
  type: "audio",
  artist: { name: "Winamp" },
  artistName: "Winamp",
  artistId: "winamp",
  albumName: "Demo",
  album: { id: "winamp-demo", name: "Demo", artist: { name: "Winamp" } },
  genres: ["Electronic"],
  duration: 0, // Will be set by player
  stream: {
    url: {
      service: "url",
      uris: [{ uri: "https://archive.org/download/winamp-demo/DEMO.mp3" }],
    },
  },
  playCount: 0,
  forcedId: "winamp-demo",
});

export default defaultMedia;
