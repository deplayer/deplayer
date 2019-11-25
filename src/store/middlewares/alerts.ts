import { I18n } from 'react-redux-i18n'
import Alert from 'react-s-alert'

import AlertContentTemplate from './AlertContentTemplate'
import * as types from '../../constants/ActionTypes'

type Action = {
  type: string,
  notification: string
}

const alerts = () => next => (action: Action) => {
  if (action.type === types.SEND_NOTIFICATION) {
    const options = {
      effect: 'stackslide',
      position: 'top-right',
      offset: 50
    }
    Alert.info(I18n.t(action.notification), options)
  }
  return next(action)
}

export default alerts
