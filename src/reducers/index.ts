import { i18nReducer } from 'react-redux-i18n'
import { State as PlayerState } from './player'

import app, { State as AppState } from './app'
import artist, { State as ArtistState } from './artist'
import player from './player'
import collection, { State as CollectionState } from './collection'
import connection, { State as ConnectionState } from './connection'
import search, { State as SearchState } from './search'
import peers, { State as PeerState } from "./peers";
import rooms, { State as RoomsState } from "./rooms";

export type State = {
  app: AppState
  artist: ArtistState
  collection: CollectionState
  connection: ConnectionState
  player: PlayerState
  search: SearchState
  peers: PeerState
  rooms: RoomsState
}

const reducers = {
  app,
  artist,
  collection,
  connection,
  player,
  search,
  peers,
  i18n: i18nReducer,
  rooms,
};

export default reducers
