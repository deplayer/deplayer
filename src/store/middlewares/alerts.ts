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
    if (action.level === "success") toast.success(I18n.t(action.notification), options);
    if (action.level === "error") toast.error(I18n.t(action.notification), options);
    if (action.level === "warn") toast.warn(I18n.t(action.notification), options);
    if (action.level === "info") toast.info(I18n.t(action.notification), options);
  }
  return next(action);
};

export default alerts;
