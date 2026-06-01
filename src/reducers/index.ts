import { i18nReducer } from 'react-redux-i18n'
import { State as PlayerState } from './player'

import artist, { State as ArtistState } from './artist'
import player from './player'
import collection, { State as CollectionState } from './collection'
import search, { State as SearchState } from './search'
import peers, { State as PeerState } from "./peers";
import rooms, { State as RoomsState } from "./rooms";

export type State = {
  artist: ArtistState
  collection: CollectionState
  player: PlayerState
  search: SearchState
  peers: PeerState
  rooms: RoomsState
}

const reducers = {
  artist,
  collection,
  player,
  search,
  peers,
  i18n: i18nReducer,
  rooms,
};

export default reducers
