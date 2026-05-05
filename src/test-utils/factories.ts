import type { MediaRow, ArtistRow, AlbumRow, Stream } from "../types/media";

interface ArtistOverrides extends Partial<ArtistRow> {
  [key: string]: unknown;
}

interface AlbumOverrides extends Partial<AlbumRow> {
  [key: string]: unknown;
}

interface MediaOverrides extends Partial<MediaRow> {
  [key: string]: unknown;
}

export const createTestArtist = (overrides: ArtistOverrides = {}): ArtistRow => {
  return {
    id: "test-artist-id",
    name: "Test Artist",
    ...overrides,
  };
};

export const createTestAlbum = (overrides: AlbumOverrides = {}): AlbumRow => {
  return {
    id: "test-album-id",
    name: "Test Album",
    artistId: overrides.artistId || "test-artist-id",
    thumbnailUrl: null,
    year: null,
    ...overrides,
  };
};

export const createTestMedia = (overrides: MediaOverrides = {}): MediaRow => {
  const defaultStream: Record<string, Stream> = {
    local: {
      service: "local",
      uris: [{ uri: "file:///test.mp3" }],
    },
  };

  return {
    id: "test-media-id",
    title: "Test Song",
    artistId: "test-artist-id",
    albumId: "test-album-id",
    artistName: "Test Artist",
    albumName: "Test Album",
    type: "audio",
    duration: 180,
    playCount: 0,
    track: 1,
    discNumber: null,
    stream: defaultStream,
    cover: null,
    genres: [],
    externalId: null,
    shareUrl: null,
    filePath: null,
    genresFlat: "",
    providersFlat: "local",
    ...overrides,
  };
};

export const createTestMediaList = (
  count: number,
  overrides: MediaOverrides = {}
): MediaRow[] => {
  return Array.from({ length: count }, (_, i) =>
    createTestMedia({
      id: `test-media-${i + 1}`,
      title: `Test Song ${i + 1}`,
      track: i + 1,
      ...overrides,
    })
  );
};
