import { combineReducers } from 'redux'
import { i18nReducer } from 'react-redux-i18n'
import { State as PlayerState } from './player'

import app, { State as AppState } from './app'
import artist from './artist'
import player from './player'
import playlist from './playlist'
import collection, { State as CollectionState } from './collection'
import connection from './connection'
import lyrics from './lyrics'
import search from './search'
import settings from './settings'
import queue, { State as QueueState } from './queue'
import { State as SearchState } from './search'

export type State = {
  app: AppState
  player: PlayerState
  queue: QueueState
  collection: CollectionState
  search: SearchState
}

export default (_history: any): State => combineReducers({
  app,
  artist,
  player,
  playlist,
  collection,
  connection,
  lyrics,
  search,
  settings,
  queue,
  i18n: i18nReducer
})
