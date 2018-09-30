// @flow

import { combineReducers } from 'redux'
import { i18nReducer } from 'react-redux-i18n'

import playlist from './playlist'
import collection from './collection'
import table from './table'
import search from './search/reducer'

export default combineReducers({
  playlist,
  collection,
  table,
  search,
  i18n: i18nReducer
})
