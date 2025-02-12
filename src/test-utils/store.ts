import { configureStore } from "@reduxjs/toolkit";
import { AnyAction } from "redux";
import { State as RootState } from "../reducers";
import { State as CollectionState } from "../reducers/collection";
import { State as SearchState } from "../reducers/search";
import { State as QueueState } from "../reducers/queue";
import { State as PlayerState } from "../reducers/player";
import { State as SettingsState } from "../reducers/settings";
import { State as AppState } from "../reducers/app";
import { State as ArtistState } from "../reducers/artist";
import { State as ConnectionState } from "../reducers/connection";
import { State as LyricsState } from "../reducers/lyrics";
import { State as PlaylistState } from "../reducers/playlist";
import { State as PeerState } from "../reducers/peers";
import { State as RoomsState } from "../reducers/rooms";

export const createDefaultState = (): RootState => ({
  app: {
    backgroundImage: "",
    sidebarToggled: false,
    showAddMediaModal: false,
    mqlMatch: false,
    heightMqlMatch: false,
    loading: false,
    displayMiniQueue: false,
    showSpectrum: false,
    showVisuals: false,
    rightPanelToggled: false,
    ready: false
  } as AppState,
  artist: {
    artistMetadata: {}
  } as ArtistState,
  collection: {
    rows: {},
    albums: {},
    artists: {},
    songsByArtist: {},
    songsByAlbum: {},
    albumsByArtist: {},
    songsByGenre: {},
    mediaByType: {},
    songsByNumberOfPlays: [],
    searchTerm: "",
    searchResults: [],
    enabledProviders: [],
    loading: false,
    totalRows: 0,
    activeFilters: {
      genres: [],
      types: [],
      artists: [],
      providers: []
    },
    filteredSongs: [],
    recentAlbums: []
  } as CollectionState,
  connection: {
    connected: false
  } as ConnectionState,
  lyrics: {
    lyrics: "",
    error: ""
  } as LyricsState,
  player: {
    playing: false,
    buffered: 0,
    duration: 0,
    loadedSeconds: 0,
    playedSeconds: 0,
    showPlayer: false,
    fullscreen: false,
    currentTime: 0,
    providers: {},
    streams: {},
    streamUri: null,
    errorCount: 0,
    volume: 100,
    peerStreaming: {
      isStreaming: false,
      peerId: null
    }
  } as PlayerState,
  playlist: {
    trackIds: [],
    playlists: [],
    smartPlaylists: []
  } as PlaylistState,
  queue: {
    trackIds: [],
    currentPlaying: null,
    repeat: false,
    shuffle: false,
    randomTrackIds: [],
    nextSongId: null,
    prevSongId: null
  } as QueueState,
  search: {
    searchTerm: "",
    loading: false,
    error: "",
    searchToggled: false,
    searchResults: []
  } as SearchState,
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
  } as SettingsState,
  peers: {
    peers: {},
    error: null,
    loading: false,
    username: "",
    peerId: null,
    roomCode: null,
  } as PeerState,
  rooms: {
    rooms: []
  } as RoomsState
});

export const createTestStore = (initialState: Partial<RootState> = {}) => {
  const defaultState = createDefaultState();

  return configureStore({
    reducer: (state = defaultState, _action: AnyAction) => state,
    preloadedState: { ...defaultState, ...initialState },
  });
};
