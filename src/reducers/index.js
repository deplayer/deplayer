// @flow

import { combineReducers } from 'redux'
import { i18nReducer } from 'react-redux-i18n'

import player from './player'
import playlist from './playlist'
import collection from './collection'
import search from './search'
import settings from './settings'
import queue from './queue'

export default combineReducers({
  player,
  playlist,
  collection,
  search,
  settings,
  queue,
  i18n: i18nReducer
})
