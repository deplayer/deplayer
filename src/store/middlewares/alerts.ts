import { I18n } from "react-redux-i18n";
import { toast, ToastOptions } from 'react-toastify';


import * as types from "../../constants/ActionTypes";

type Action = {
  type: string;
  notification: string;
};

const alerts = () => (next: any) => (action: Action) => {
  if (action.type === types.SEND_NOTIFICATION) {
    const options = {
      effect: "stackslide",
      position: "top-right",
      offset: 50,
    } as ToastOptions;
    toast.info(I18n.t(action.notification), options);
  }
  return next(action);
};

export default alerts;
