import { combineReducers } from 'redux'
import { i18nReducer } from 'react-redux-i18n'
import { connectRouter } from 'connected-react-router'

import app from './app'
import player from './player'
import playlist from './playlist'
import collection from './collection'
import connection from './connection'
import search from './search'
import settings from './settings'
import queue from './queue'


export default (history) => combineReducers({
  app,
  player,
  playlist,
  collection,
  connection,
  search,
  settings,
  queue,
  i18n: i18nReducer,
  router: connectRouter(history),
})
