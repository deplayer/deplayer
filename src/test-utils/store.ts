import { configureStore } from "@reduxjs/toolkit";
import { AnyAction } from "redux";
import { State as RootState } from "../reducers";
import { State as CollectionState, defaultState as collectionDefaultState } from "../reducers/collection";
import { State as SearchState, defaultState as searchDefaultState } from "../reducers/search";
import { State as QueueState, defaultState as queueDefaultState } from "../reducers/queue";
import { State as PlayerState, defaultState as playerDefaultState } from "../reducers/player";
import { State as SettingsState, defaultState as settingsDefaultState } from "../reducers/settings";
import { State as AppState, defaultState as appDefaultState } from "../reducers/app";
import { State as ArtistState, defaultState as artistDefaultState } from "../reducers/artist";
import { State as ConnectionState, defaultState as connectionDefaultState } from "../reducers/connection";
import { State as LyricsState, defaultState as lyricsDefaultState } from "../reducers/lyrics";
import { State as PlaylistState, defaultState as playlistDefaultState } from "../reducers/playlist";
import { State as PeerState } from "../reducers/peers";
import { State as RoomsState, defaultState as roomsDefaultState } from "../reducers/rooms";

export const createDefaultState = (): RootState => ({
  app: appDefaultState as AppState,
  artist: artistDefaultState as ArtistState,
  collection: collectionDefaultState as CollectionState,
  connection: connectionDefaultState as ConnectionState,
  lyrics: lyricsDefaultState as LyricsState,
  player: playerDefaultState as PlayerState,
  playlist: playlistDefaultState as PlaylistState,
  queue: queueDefaultState as QueueState,
  search: searchDefaultState as SearchState,
  settings: settingsDefaultState as SettingsState,
  peers: {
    peers: {},
    error: null,
    loading: false,
    username: "",
    peerId: null,
    roomCode: null,
  } as PeerState,
  rooms: roomsDefaultState as RoomsState,
});

export const createTestStore = (initialState: Partial<RootState> = {}) => {
  const defaultState = createDefaultState();

  return configureStore({
    reducer: (state = defaultState, _action: AnyAction) => state,
    preloadedState: { ...defaultState, ...initialState },
  });
};
