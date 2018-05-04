import { combineReducers } from 'redux'
import playlist from './playlist'
import collection from './collection'

export default combineReducers({
  playlist,
  collection
})
