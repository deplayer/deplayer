import Media, { IMedia, Stream } from "../entities/Media";
import Artist, { IArtist } from "../entities/Artist";
import Album, { IAlbum } from "../entities/Album";

interface ArtistOverrides extends Partial<IArtist> {
  [key: string]: any;
}

interface AlbumOverrides extends Partial<IAlbum> {
  [key: string]: any;
}

interface MediaOverrides extends Partial<IMedia> {
  [key: string]: any;
}

export const createTestArtist = (overrides: ArtistOverrides = {}): Artist => {
  return new Artist({
    name: "Test Artist",
    ...overrides,
  });
};

export const createTestAlbum = (overrides: AlbumOverrides = {}): Album => {
  const artist = overrides.artist || createTestArtist();
  return new Album({
    name: "Test Album",
    artist,
    ...overrides,
  });
};

export const createTestMedia = (overrides: MediaOverrides = {}): Media => {
  const artist = overrides.artist || createTestArtist();
  const album = overrides.album || createTestAlbum({ artist });

  const defaultStream: { [key: string]: Stream } = {
    local: {
      service: "local",
      uris: [{ uri: "file:///test.mp3" }],
    },
  };

  return new Media({
    title: "Test Song",
    artist,
    album,
    artistName: artist.name,
    albumName: album.name,
    type: "audio",
    duration: 180,
    track: 1,
    year: 2024,
    genres: [],
    stream: defaultStream,
    ...overrides,
  });
};

export const createTestMediaList = (
  count: number,
  overrides: MediaOverrides = {}
): Media[] => {
  return Array.from({ length: count }, (_, i) =>
    createTestMedia({
      title: `Test Song ${i + 1}`,
      track: i + 1,
      ...overrides,
    })
  );
};
