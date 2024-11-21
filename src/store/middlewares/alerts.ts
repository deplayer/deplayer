import { I18n } from "react-redux-i18n";
import { toast, ToastOptions } from 'react-toastify';


import * as types from "../../constants/ActionTypes";

type Action = {
  type: string;
  notification: string;
  level: 'error' | 'info' | 'success' | 'warn'
  duration?: number
};

const alerts = () => (next: any) => (action: Action) => {
  if (action.type === types.SEND_NOTIFICATION) {
    const options = {
      effect: "stackslide",
      position: "top-right",
      offset: 50,
    } as ToastOptions

    const autoClose = action.duration || 5000
    options.autoClose = autoClose

    switch (action.level) {
      case "success":
        toast.success(I18n.t(action.notification), options)
        break;
      case "error":
        toast.error(I18n.t(action.notification), options)
        break;
      case "warn":
        toast.warn(I18n.t(action.notification), options)
        break;
      case "info":
      default:
        toast.info(I18n.t(action.notification), options)
        break;
    }
  }
  return next(action)
};

export default alerts;
