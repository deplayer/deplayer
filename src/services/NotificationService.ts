import logger from '../utils/logger'

// fix ts window typings
// eslint-disable-next-line no-var -- `declare var` is required for ambient global augmentation
declare var window: Window & { Notification?: typeof Notification }

export default class NotificationService {
  getNotificationClass () {
    const Notification = window.Notification

    if (!Notification) {
      logger.log("This browser does not support desktop notification");
      return
    }

    else if (Notification.permission !== "granted") {
      return
    }

    return Notification
  }

  requestPermission = () => {
    const Notification = this.getNotificationClass()
    if (Notification) {
      Notification.requestPermission()
    }
  }
}
