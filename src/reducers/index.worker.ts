import { combineReducers } from 'redux'
import { i18nReducer } from 'react-redux-i18n'
import { createWorker } from 'redux-worker'

import app from './app'
import artist from './artist'
import player from './player'
import playlist from './playlist'
import collection from './collection'
import connection from './connection'
import search from './search'
import settings from './settings'
import queue from './queue'
import mockedRouter from './mockedRouter'

const worker = createWorker()
const reducers = combineReducers({
  app,
  artist,
  player,
  playlist,
  collection,
  connection,
  search,
  settings,
  queue,
  i18n: i18nReducer,
  router: mockedRouter
})
worker.registerReducer(reducers)

export default worker
