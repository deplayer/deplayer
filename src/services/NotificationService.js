// @flow

export default class NotificationService {
  sendNotification = () => {
    const Notification = this.getNotificationClass()
    if (Notification) {
      new Notification("Welcome to genar-radio!");
    }
  }

  getNotificationClass () {
    const Notification = window.Notification

    // Let's check if the browser supports notifications
    if (!Notification) {
      console.log("This browser does not support desktop notification");
    }

    // Let's check whether notification permissions have already been granted
    else if (Notification.permission === "granted") {
      // If it's okay let's create a notification
      new Notification("Welcome to genar-radio!");
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
