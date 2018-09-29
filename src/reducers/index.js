// @flow

import { combineReducers } from 'redux'
import playlist from './playlist'
import collection from './collection'
import table from './table'
import search from './search/reducer'

export default combineReducers({
  playlist,
  collection,
  table,
  search
})
