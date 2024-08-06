import { i18nReducer } from 'react-redux-i18n'
import { State as PlayerState } from './player'

import app, { State as AppState } from './app'
import artist, { State as ArtistState } from './artist'
import player from './player'
import playlist, { State as PlaylistState } from './playlist'
import collection, { State as CollectionState } from './collection'
import connection, { State as ConnectionState } from './connection'
import lyrics, { State as LyricsState } from './lyrics'
import search, { State as SearchState } from './search'
import settings, { State as SettingsState } from './settings'
import queue, { State as QueueState } from './queue'

export type State = {
  app: AppState
  artist: ArtistState
  collection: CollectionState
  connection: ConnectionState
  lyrics: LyricsState
  player: PlayerState
  playlist: PlaylistState
  queue: QueueState
  search: SearchState
  settings: SettingsState
}

const reducers = {
  app,
  artist,
  collection,
  connection,
  lyrics,
  player,
  playlist,
  queue,
  search,
  settings,
  i18n: i18nReducer
}

export default reducers
