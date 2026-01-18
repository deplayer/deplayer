import { describe, expect, it } from "vitest";
import * as types from "../constants/ActionTypes";
import Media from "../entities/Media";
import reducer, { defaultState } from "./collection";
import { mediaParams } from "../entities/Media.spec";

describe("collection reducer", () => {
  it("should return the initial state", () => {
    expect(reducer(undefined, {})).toEqual(defaultState);
  });

  it("should handle RECEIVE_COLLECTION", () => {
    const initialState = { ...defaultState, enabledProviders: ["itunes"] };
    const fixtureSong = new Media({
      ...mediaParams,
      forcedId: "the-doors",
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
    const fixtureSong = new Media({
      ...mediaParams,
      forcedId: "the-doors",
      artistName: "The Doors",
    });

    const state = {
      ...defaultState,
      rows: { [fixtureSong.id]: fixtureSong.toDocument() },
    };

    const expected = {
      ...state,
      loading: false,
      searchResults: [fixtureSong.id],
    };

    expect(
      reducer(state, {
        type: types.SEARCH_FINISHED,
        data: [fixtureSong.toDocument()],
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
      new Media({ ...mediaParams, forcedId: "song1" }).toDocument(),
      new Media({ ...mediaParams, forcedId: "song2" }).toDocument(),
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
