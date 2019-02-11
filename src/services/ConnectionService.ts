import * as types from '../constants/ActionTypes'
import { Dispatch } from 'redux'

export default class ConnectionService {
  dispatch: Dispatch

  constructor(dispatch) {
    this.dispatch = dispatch
  }

  registerConnection() {
    window.addEventListener('load', () => {
      function updateOnlineStatus(event) {
        if (navigator.onLine) {
          this.dispatch({type: types.SET_ONLINE_CONNECTION})
        } else {
          this.dispatch({type: types.SET_OFFLINE_CONNECTION})
        }
      }

      window.addEventListener('online', updateOnlineStatus)
      window.addEventListener('offline', updateOnlineStatus)
    })
  }
}
