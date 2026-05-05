import type { MediaRow } from '../types/media'
import logger from '../utils/logger'

// fix ts window typings
declare var window: Window & { Notification?: typeof Notification; MediaMetadata?: unknown }

export default class NotificationService {
  sendNotification = (media: MediaRow) => {
    const Notification = this.getNotificationClass()
    if (Notification) {
      new Notification(
        media.title + ' - ' + media.artistName
      )
    }
  }

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
