import * as types from '../constants/ActionTypes'

type State = {
  playing: boolean,
  currentTime: number,
  errorCount: number,
  volume: number
}

export const defaultState = {
  playing: false,
  currentTime: 0,
  errorCount: 0,
  volume: 100
}

export default (state: State = defaultState, action: any): State => {
  switch (action.type) {
    case types.START_PLAYING:
      return {...state, playing: true}

    case types.VOLUME_SET:
      return {...state, volume: action.value}

    case types.SET_CURRENT_TIME:
      return {...state, currentTime: action.value}

    case types.REGISTER_PLAYER_ERROR:
      return {...state, errorCount: state.errorCount + 1}

    default:
      return state
  }
}
