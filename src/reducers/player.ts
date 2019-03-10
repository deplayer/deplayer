import * as types from '../constants/ActionTypes'

type State = {
  playing: boolean,
  currentTime: number,
  volume: number
}

export const defaultState = {
  playing: false,
  currentTime: 0,
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

    default:
      return state
  }
}
