import * as types from '../constants/ActionTypes'

export type State = {
  playing: boolean,
  showPlayer: boolean,
  currentTime: number,
  errorCount: number,
  streamUri: string | null,
  streams: object,
  providers: object,
  volume: number
}

export const defaultState = {
  playing: false,
  showPlayer: false,
  currentTime: 0,
  providers: {},
  streams: {},
  streamUri: null,
  errorCount: 0,
  volume: 100
}

export default (state: State = defaultState, action: any): State => {
  switch (action.type) {
    case types.START_PLAYING:
      return {...state, playing: true, showPlayer: true}

    case types.CLEAR_QUEUE:
    case types.HIDE_PLAYER:
      return {...state, showPlayer: false}

    case types.VOLUME_SET:
      return {...state, volume: action.value}

    case types.SET_CURRENT_TIME:
      return {...state, currentTime: action.value}

    case types.REGISTER_PLAYER_ERROR:
      return {...state, errorCount: state.errorCount + 1}

    case types.CLEAR_PLAYER_ERRORS:
    case types.SONG_PLAYED:
      return {...state, errorCount: 0}

    case types.SET_CURRENT_PLAYING_URL:
      return {...state, streamUri: action.url}

    case types.SET_CURRENT_PLAYING_STREAMS:
      return {...state, streams: action.streams}

    default:
      return state
  }
}
