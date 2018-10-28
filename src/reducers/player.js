// @flow

import * as types from '../constants/ActionTypes'
import { Action } from 'redux'

type State = {
  trackIds: Array<string>,
  playing: boolean,
  volume: number
}

export const defaultState = {
  trackIds: [],
  playing: false,
  volume: 100
}

export default (state: State = defaultState, action: Action = {}): State => {
  switch (action.type) {
    case types.START_PLAYING:
      return {...state, playing: true}

    case types.VOLUME_SET:
      return {...state, volume: action.value}

    default:
      return state
  }
}
