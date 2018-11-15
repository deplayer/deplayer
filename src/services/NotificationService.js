// @flow

export default class NotificationService {
  constructor() {
    const Notification = window.Notification

    // Let's check if the browser supports notifications
    if (!Notification) {
      alert("This browser does not support desktop notification");
    }

    // Let's check whether notification permissions have already been granted
    else if (Notification.permission === "granted") {
      // If it's okay let's create a notification
      new Notification("Welcome to genar-radio!");
    }
  }
}
