import { expectSaga } from "redux-saga-test-plan";
import { call } from "redux-saga/effects";
import { describe, it, beforeEach } from "vitest";
import { fetchSongMetadata } from "./index";
import * as types from "../../constants/ActionTypes";
import LyricsovhProvider from "../../providers/LyricsovhProvider";
import { IMedia } from "../../entities/Media";
import { IArtist } from "../../entities/Artist";
import { ILyricsRepository } from "./index";

// Test implementation of the repository
class TestLyricsRepository implements ILyricsRepository {
  private storedLyrics: { [key: string]: string } = {};

  async getLyrics(songId: string) {
    const lyrics = this.storedLyrics[songId];
    return lyrics ? { lyrics } : null;
  }

  async saveLyrics(songId: string, lyrics: string) {
    this.storedLyrics[songId] = lyrics;
  }

  async ensureSongExists(_song: any) {
    // No-op for testing
  }

  // Helper method for testing
  setStoredLyrics(songId: string, lyrics: string) {
    this.storedLyrics[songId] = lyrics;
  }
}

describe("artist saga", () => {
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
    let lyricsRepo: TestLyricsRepository;

    beforeEach(() => {
      lyricsRepo = new TestLyricsRepository();
    });

    it("should fetch lyrics from local storage if available", async () => {
      lyricsRepo.setStoredLyrics("123", "Stored lyrics");

      return expectSaga(fetchSongMetadata, {
        type: types.FETCH_LYRICS,
        songId: "123",
      }, lyricsRepo)
        .withState(mockState)
        .call([lyricsRepo, "getLyrics"], "123")
        .put({ type: types.LYRICS_FOUND, data: "Stored lyrics" })
        .run();
    });

    it("should handle empty database response correctly", async () => {
      const mbProvider = new LyricsovhProvider();
      const apiResponse = { lyrics: "API lyrics" };

      return expectSaga(fetchSongMetadata, {
        type: types.FETCH_LYRICS,
        songId: "123",
      }, lyricsRepo)
        .withState(mockState)
        .call([lyricsRepo, "getLyrics"], "123")
        .call([mbProvider, "searchLyrics"], mockSong)
        .call([lyricsRepo, "saveLyrics"], "123", apiResponse.lyrics)
        .put({ type: types.LYRICS_FOUND, data: apiResponse.lyrics })
        .provide([
          [call([mbProvider, "searchLyrics"], mockSong), apiResponse],
        ])
        .run();
    });

    it("should handle null database response correctly", () => {
      const mbProvider = new LyricsovhProvider();
      const apiResponse = { lyrics: "API lyrics" };

      return expectSaga(fetchSongMetadata, {
        type: types.FETCH_LYRICS,
        songId: "123",
      }, lyricsRepo)
        .withState(mockState)
        .call([lyricsRepo, "getLyrics"], "123")
        .call([mbProvider, "searchLyrics"], mockSong)
        .call([lyricsRepo, "saveLyrics"], "123", apiResponse.lyrics)
        .put({ type: types.LYRICS_FOUND, data: apiResponse.lyrics })
        .provide([
          [call([mbProvider, "searchLyrics"], mockSong), apiResponse],
        ])
        .run();
    });

    it("should fetch lyrics from API if not in local storage", () => {
      const apiResponse = { lyrics: "API lyrics" };
      const mbProvider = new LyricsovhProvider();

      return expectSaga(fetchSongMetadata, {
        type: types.FETCH_LYRICS,
        songId: "123",
      }, lyricsRepo)
        .withState(mockState)
        .call([lyricsRepo, "getLyrics"], "123")
        .call([mbProvider, "searchLyrics"], mockSong)
        .call([lyricsRepo, "saveLyrics"], "123", apiResponse.lyrics)
        .put({ type: types.LYRICS_FOUND, data: apiResponse.lyrics })
        .provide([
          [call([mbProvider, "searchLyrics"], mockSong), apiResponse],
        ])
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
      }, lyricsRepo)
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
      }, lyricsRepo)
        .withState(mockState)
        .call([lyricsRepo, "getLyrics"], "123")
        .call([mbProvider, "searchLyrics"], mockSong)
        .put({ type: types.NO_LYRICS_FOUND, error: error.message })
        .provide([
          [call([mbProvider, "searchLyrics"], mockSong), Promise.reject(error)],
        ])
        .run();
    });
  });
});
