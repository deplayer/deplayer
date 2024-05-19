import { combineReducers } from 'redux'
import { i18nReducer } from 'react-redux-i18n'
// import { connectRouter } from 'connected-react-router'

import app from './app'
import artist from './artist'
import player from './player'
import playlist from './playlist'
import collection from './collection'
import connection from './connection'
import lyrics from './lyrics'
import search from './search'
import settings from './settings'
import queue from './queue'

type State = any

export default (history: any): State => combineReducers({
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
  i18n: i18nReducer,
  // router: connectRouter(history),
})
