import { configureStore } from "@reduxjs/toolkit";
import { AnyAction } from "redux";
import { StoreState } from "../reducers/types";

export const createDefaultState = (): Partial<StoreState> => ({
  collection: {
    rows: {},
    albums: {},
    artists: {},
    songsByArtist: {},
    songsByAlbum: {},
    albumsByArtist: {},
    covers: {},
    artistCovers: {},
    albumCovers: {},
    loading: false,
    error: null,
    lastUpdate: null,
    lastScan: null,
    scanInProgress: false,
    scanErrors: [],
    scanProgress: 0,
    searchResults: [],
  },
  settings: {
    settings: {
      app: {
        spectrum: { enabled: false },
        lastfm: { enabled: false, apikey: "" },
        language: { code: "en", useSystemLanguage: true },
      },
      providers: {},
    },
    settingsForm: { providers: {}, fields: {} },
    error: "",
    saving: false,
  },
  search: {
    searchTerm: "",
    loading: false,
    error: "",
    searchToggled: false,
  },
  queue: {
    trackIds: [],
    currentPlaying: null,
    repeat: false,
    shuffle: false,
  },
  player: {
    playing: false,
    volume: 100,
    currentTime: 0,
    showPlayer: false,
  },
});

export const createTestStore = (initialState: Partial<StoreState> = {}) => {
  const defaultState = createDefaultState();

  return configureStore({
    reducer: {
      collection: (state = defaultState.collection, _action: AnyAction) =>
        state,
      settings: (state = defaultState.settings, _action: AnyAction) => state,
      search: (state = defaultState.search, _action: AnyAction) => state,
      queue: (state = defaultState.queue, _action: AnyAction) => state,
      player: (state = defaultState.player, _action: AnyAction) => state,
    },
    preloadedState: { ...defaultState, ...initialState },
  });
};
