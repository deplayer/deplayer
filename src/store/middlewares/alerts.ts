import { I18n } from "react-redux-i18n";
import { toast, ToastOptions } from 'react-toastify';


import * as types from "../../constants/ActionTypes";

type Action = {
  type: string;
  notification: string;
  level: 'error' | 'info' | 'success' | 'warn'
};

const alerts = () => (next: any) => (action: Action) => {
  if (action.type === types.SEND_NOTIFICATION) {
    const options = {
      effect: "stackslide",
      position: "top-right",
      offset: 50,
    } as ToastOptions

    switch (action.level) {
      case "success":
        options.autoClose = 5000
        toast.success(I18n.t(action.notification), options)
        break;
      case "error":
        options.autoClose = false
        toast.error(I18n.t(action.notification), options)
        break;
      case "warn":
        options.autoClose = 5000
        toast.warn(I18n.t(action.notification), options)
        break;
      case "info":
      default:
        options.autoClose = 5000
        toast.info(I18n.t(action.notification), options)
        break;
    }
  }
  return next(action)
};

export default alerts;
