import { combineReducers } from 'redux'
import playlist from './playlist'
import collection from './collection'
import table from './table'

export default combineReducers({
  playlist,
  collection,
  table
})
