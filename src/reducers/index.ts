import { combineReducers } from 'redux'
import { i18nReducer } from 'react-redux-i18n'
import { connectRouter } from 'connected-react-router'

import { defaultState as app } from './app'
import { defaultState as artist } from './artist'
import { defaultState as player } from './player'
import { defaultState as playlist } from './playlist'
import { defaultState as collection } from './collection'
import { defaultState as connection } from './connection'
import { defaultState as search } from './search'
import { defaultState as settings } from './settings'
import { defaultState as queue } from './queue'
import mockedRouter from './mockedRouter'

type State = any

export default (history: any): State => combineReducers({
  app: () => app,
  artist: () => artist,
  player: () => player,
  playlist: () => playlist,
  collection: () => collection,
  connection: () => connection,
  search: () => search,
  settings: () => settings,
  queue: () => queue,
  i18n: i18nReducer,
  // router: connectRouter(history),
  router: mockedRouter
})
