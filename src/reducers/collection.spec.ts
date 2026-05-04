import { describe, expect, it } from "vitest";
import * as types from "../constants/ActionTypes";
import type { MediaRow } from "../types/media";
import reducer, { defaultState } from "./collection";

const createTestMediaRow = (overrides: Partial<MediaRow> = {}): MediaRow => ({
  id: "test-id",
  title: "Test Song",
  artistId: "test-artist",
  albumId: "test-album",
  artistName: "Test Artist",
  albumName: "Test Album",
  type: "audio",
  duration: 180,
  playCount: 0,
  track: null,
  discNumber: null,
  stream: {},
  cover: null,
  genres: [],
  externalId: null,
  shareUrl: null,
  filePath: null,
  genresFlat: "",
  providersFlat: "",
  ...overrides,
});

describe("collection reducer", () => {
  it("should return the initial state", () => {
    expect(reducer(undefined, {})).toEqual(defaultState);
  });

  it("should handle RECEIVE_COLLECTION", () => {
    const initialState = { ...defaultState, enabledProviders: ["itunes"] };
    const fixtureSong = createTestMediaRow({
      id: "the-doors",
      artistName: "The Doors",
      type: "video",
      artistId: "the-doors",
      albumName: "Light my fire",
      stream: {
        itunes: {
          uris: [{ uri: "http://some-songs-api/song.mp4" }],
          service: "itunes",
        },
      },
    });

    // RECEIVE_COLLECTION no longer populates state
    // All data lives in LiveStore, saga handles insert directly
    const expected = {
      ...initialState,
    };

    expect(
      reducer(initialState, {
        type: types.RECEIVE_COLLECTION,
        data: [fixtureSong],
      })
    ).toMatchObject(expected);
  });

  it("should handle SEARCH_FINISHED", () => {
    const fixtureSong = createTestMediaRow({
      id: "the-doors",
      artistName: "The Doors",
    });

    const state = {
      ...defaultState,
      rows: { [fixtureSong.id]: fixtureSong },
    };

    const expected = {
      ...state,
      loading: false,
      searchResults: [fixtureSong.id],
    };

    expect(
      reducer(state, {
        type: types.SEARCH_FINISHED,
        data: [fixtureSong],
      })
    ).toMatchObject(expected);
  });

  it("should handle RECEIVE_SETTINGS to filter by provider", () => {
    const expected = { ...defaultState, enabledProviders: ["mstream"] };
    const action = {
      type: types.RECEIVE_SETTINGS,
      settings: {
        providers: {
          itunes: {
            enabled: false,
          },
          mstream: {
            enabled: true,
          },
        },
      },
    };
    expect(reducer(defaultState, action)).toEqual(expected);
  });

  it("should handle SET_SEARCH_RESULTS", () => {
    const searchResults = [
      createTestMediaRow({ id: "song1" }),
      createTestMediaRow({ id: "song2" }),
    ];
    expect(reducer(defaultState, { type: types.SET_SEARCH_RESULTS, searchResults })).toEqual({
      ...defaultState,
      searchResults: ["song1", "song2"],
    });
  });

  it("should handle SET_SEARCH_RESULTS with undefined results", () => {
    expect(reducer(defaultState, { type: types.SET_SEARCH_RESULTS })).toEqual({
      ...defaultState,
      searchResults: [],
    });
  });
});
