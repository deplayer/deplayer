import Media from '../entities/Media'
import logger from '../utils/logger'

// fix ts window typings
declare var window: any

export default class NotificationService {
  sendNotification = (media: Media) => {
    const Notification = this.getNotificationClass()
    if (Notification) {
      new Notification(
        media.title + ' - ' + media.artist.name
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
