import * as types from '../constants/ActionTypes'
import { Dispatch } from 'redux'

export default class ConnectionService {
  registerConnection = (dispatch: Dispatch) => {
    const updateOnlineStatus = (event) => {
      if (navigator.onLine) {
        console.log('enter online mode')
        dispatch({type: types.SET_ONLINE_CONNECTION})
      } else {
        console.log('exit online mode')
        dispatch({type: types.SET_OFFLINE_CONNECTION})
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
  }
}
