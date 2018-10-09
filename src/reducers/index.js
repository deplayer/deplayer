// @flow

import { combineReducers } from 'redux'
import { i18nReducer } from 'react-redux-i18n'

import playlist from './playlist'
import collection from './collection'
import search from './search'

export default combineReducers({
  playlist,
  collection,
  search,
  i18n: i18nReducer
})
