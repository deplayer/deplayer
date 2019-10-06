import * as types from '../../constants/ActionTypes'
import Alert from 'react-s-alert'
import { I18n } from 'react-redux-i18n'

type Action = {
  type: string,
  notification: string
}

const alerts = () => next => (action: Action) => {
  if (action.type === types.SEND_NOTIFICATION) {
    const options = {
      position: 'bottom',
      offset: 20
    }
    Alert.info(I18n.t(action.notification), options)
  }
  return next(action)
}

export default alerts
