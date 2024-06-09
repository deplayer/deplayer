import { Reducer } from "redux";

export default function outerReducer(appReducer: Reducer) {
  return function(state: any, action: any) {
    if (action.type === 'REDUXIE_STATE_LOADING_DONE') {
      return appReducer(action.payload.state, action);
    }
    return appReducer(state, action);
  }
}
