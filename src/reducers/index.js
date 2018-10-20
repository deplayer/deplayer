// @flow

import { combineReducers } from 'redux'
import { i18nReducer } from 'react-redux-i18n'

import playlist from './playlist'
import collection from './collection'
import search from './search'
import settings from './settings'

export default combineReducers({
  playlist,
  collection,
  search,
  settings,
  i18n: i18nReducer
})
