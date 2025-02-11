import { expectSaga } from "redux-saga-test-plan";
import * as matchers from "redux-saga-test-plan/matchers";
import { describe, it, vi, afterEach } from "vitest";
import * as types from "../../constants/ActionTypes";
import { fetchRecentAlbums } from "./index";
import Media from "../../entities/Media";
import { mediaParams } from "../../entities/Media.spec";
import ProvidersService from "../../services/ProvidersService";

// Mock ProvidersService
vi.mock("../../services/ProvidersService", () => {
  return {
    default: vi.fn(),
  };
});

describe("collection saga", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchRecentAlbums", () => {
    const mockSong = new Media({
      ...mediaParams,
      forcedId: "test-song",
      artistName: "Test Artist",
      type: "audio",
      artistId: "test-artist",
      albumName: "Test Album",
      stream: {
        subsonic: {
          uris: [{ uri: "http://test/song.mp3" }],
          service: "subsonic",
        },
      },
    });

    const mockProvider = {
      name: "subsonic",
      getRecentMedia: vi.fn().mockResolvedValue([mockSong]),
    };

    const mockSettings = {
      providers: {
        subsonic: { enabled: true },
      },
    };

    it("should fetch and process recent albums", () => {
      const mockProvidersService = {
        providers: {
          subsonic: mockProvider,
        },
      };

      // Mock the constructor to return our mock service
      (
        ProvidersService as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation(() => mockProvidersService);

      return expectSaga(fetchRecentAlbums)
        .withState({
          settings: {
            settings: mockSettings,
          },
        })
        .provide([
          [
            matchers.call([mockProvider, mockProvider.getRecentMedia]),
            [mockSong],
          ],
        ])
        .put({
          type: types.RECEIVE_COLLECTION,
          data: [mockSong],
        })
        .put({
          type: types.FETCH_RECENT_ALBUMS_SUCCESS,
          albums: [
            {
              id: mockSong.album.id,
              title: mockSong.album.name,
              name: mockSong.album.name,
              artist: mockSong.album.artist,
              artistName: mockSong.album.artist.name,
              album: mockSong.album,
              cover: mockSong.cover,
              type: "audio",
              genres: [],
              stream: mockSong.stream,
            },
          ],
        })
        .run(100); // Add timeout of 100ms
    });

    it("should handle no providers configured", () => {
      return expectSaga(fetchRecentAlbums)
        .withState({
          settings: {
            settings: { providers: {} },
          },
        })
        .run(100); // Add timeout of 100ms
    });
  });
});
