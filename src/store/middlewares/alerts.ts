import * as types from '../../constants/ActionTypes'
import Alert from 'react-s-alert'
import { I18n } from 'react-redux-i18n'

const alerts = store => next => action => {
  if (action.type === types.SEND_NOTIFICATION) {
    const options = {
      position: 'bottom'
    }
    Alert.info(I18n.t(action.notification), options)
  }
  return next(action)
}

export default alerts
