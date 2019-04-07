import * as types from '../constants/ActionTypes'
import { Dispatch } from 'redux'
import logger from '../utils/logger'

export default class ConnectionService {
  registerConnection = (dispatch: Dispatch) => {
    const updateOnlineStatus = () => {
      if (navigator.onLine) {
        logger.log('ConnectionService', 'enter online mode')
        dispatch({type: types.SET_ONLINE_CONNECTION})
      } else {
        logger.log('ConnectionService', 'exit online mode')
        dispatch({type: types.SET_OFFLINE_CONNECTION})
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    updateOnlineStatus()
  }
}
