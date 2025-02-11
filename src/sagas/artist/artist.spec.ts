import { expectSaga } from "redux-saga-test-plan";
import { call } from "redux-saga/effects";
import { describe, it } from "vitest";
import { fetchSongMetadata } from "./index";
import * as types from "../../constants/ActionTypes";
import LyricsovhProvider from "../../providers/LyricsovhProvider";
import LyricsService from "../../services/LyricsService";
import { getAdapter } from "../../services/database";
import { IMedia } from "../../entities/Media";
import { IArtist } from "../../entities/Artist";
import { createTestLogger } from "../../test-utils/testLogger";

const logger = createTestLogger("ArtistSagaTest");

describe("artist saga", () => {
  const adapter = getAdapter();
  const lyricsService = new LyricsService(adapter);
  const mockArtist: IArtist = {
    name: "Test Artist",
    id: "artist-123",
  };
  const mockSong: IMedia = {
    id: "123",
    title: "Test Song",
    artist: mockArtist,
    album: {
      name: "Test Album",
      id: "album-123",
      artist: mockArtist,
    },
    artistName: "Test Artist",
    type: "audio",
    stream: {},
    genres: [],
    albumName: "Test Album",
  };

  const mockState = {
    collection: {
      rows: {
        "123": mockSong,
      },
    },
  };

  describe("fetchSongMetadata", () => {
    it("should fetch lyrics from local storage if available", async () => {
      const storedLyrics = { lyrics: "Stored lyrics" };
      logger.info("Database response:", storedLyrics);
      logger.info("Found lyrics in database:", storedLyrics);

      return expectSaga(fetchSongMetadata, {
        type: types.FETCH_LYRICS,
        songId: "123",
      })
        .withState(mockState)
        .provide([[call([lyricsService, "get"], "123"), storedLyrics]])
        .put({ type: types.LYRICS_FOUND, data: storedLyrics.lyrics })
        .run();
    });

    it("should handle empty database response correctly", async () => {
      const song = {
        id: "123",
        title: "Test Song",
        artist: { name: "Test Artist", id: "artist-123" },
        album: {
          name: "Test Album",
          id: "album-123",
          artist: { name: "Test Artist", id: "artist-123" },
        },
        artistName: "Test Artist",
        type: "audio",
        stream: {},
        genres: [],
        albumName: "Test Album",
      };

      logger.info("Database response:", []);
      logger.info("No lyrics in database, fetching from API for song:", song);
      logger.info("API Response:", { lyrics: "API lyrics" });

      const mbProvider = new LyricsovhProvider();
      const apiResponse = { lyrics: "API lyrics" };

      return expectSaga(fetchSongMetadata, {
        type: types.FETCH_LYRICS,
        songId: "123",
      })
        .withState(mockState)
        .provide([
          [call([lyricsService, "get"], "123"), []],
          [call([mbProvider, "searchLyrics"], mockSong), apiResponse],
        ])
        .put({ type: types.LYRICS_FOUND, data: apiResponse.lyrics })
        .run();
    });

    it("should handle null database response correctly", () => {
      const mbProvider = new LyricsovhProvider();
      const apiResponse = { lyrics: "API lyrics" };

      return expectSaga(fetchSongMetadata, {
        type: types.FETCH_LYRICS,
        songId: "123",
      })
        .withState(mockState)
        .provide([
          [call([lyricsService, "get"], "123"), null],
          [call([mbProvider, "searchLyrics"], mockSong), apiResponse],
        ])
        .put({ type: types.LYRICS_FOUND, data: apiResponse.lyrics })
        .run();
    });

    it("should fetch lyrics from API if not in local storage", () => {
      const apiResponse = { lyrics: "API lyrics" };
      const mbProvider = new LyricsovhProvider();

      return expectSaga(fetchSongMetadata, {
        type: types.FETCH_LYRICS,
        songId: "123",
      })
        .withState(mockState)
        .provide([
          [call([lyricsService, "get"], "123"), null],
          [call([mbProvider, "searchLyrics"], mockSong), apiResponse],
          [call([lyricsService, "save"], "123", apiResponse.lyrics), null],
        ])
        .put({ type: types.LYRICS_FOUND, data: apiResponse.lyrics })
        .run();
    });

    it("should handle errors gracefully when song is not found", () => {
      const emptyState = {
        collection: {
          rows: {},
        },
      };

      return expectSaga(fetchSongMetadata, {
        type: types.FETCH_LYRICS,
        songId: "123",
      })
        .withState(emptyState)
        .put({ type: types.NO_LYRICS_FOUND, error: "Song not found" })
        .run();
    });

    it("should handle API errors gracefully", () => {
      const error = new Error("Failed to fetch lyrics");
      const mbProvider = new LyricsovhProvider();

      return expectSaga(fetchSongMetadata, {
        type: types.FETCH_LYRICS,
        songId: "123",
      })
        .withState(mockState)
        .provide([
          [call([lyricsService, "get"], "123"), null],
          [call([mbProvider, "searchLyrics"], mockSong), Promise.reject(error)],
        ])
        .put({ type: types.NO_LYRICS_FOUND, error: error.message })
        .run();
    });
  });
});
