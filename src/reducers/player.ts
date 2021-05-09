import * as types from '../constants/ActionTypes'

export type State = {
  playing: boolean,
  buffered: number,
  duration: number,
  loadedSeconds: number,
  playedSeconds: number,
  showPlayer: boolean,
  fullscreen: boolean,
  currentTime: number,
  errorCount: number,
  streamUri: string | null,
  streams: object,
  providers: object,
  volume: number
}

export const defaultState = {
  playing: false,
  buffered: 0,
  duration: 0,
  loadedSeconds: 0,
  playedSeconds: 0,
  showPlayer: false,
  fullscreen: false,
  currentTime: 0,
  providers: {},
  streams: {},
  streamUri: null,
  errorCount: 0,
  volume: 100
}

export default (state: State = defaultState, action: any): State => {
  switch (action.type) {
    case types.PAUSE_PLAYING:
    case types.STOP_PLAYING:
      return {...state, playing: false}

    case types.START_PLAYING:
      return {...state, playing: true, showPlayer: true}

    case types.TOGGLE_PLAYING:
      return {...state, playing: !state.playing}

    case types.CLEAR_QUEUE:
    case types.HIDE_PLAYER:
      return {...state, showPlayer: false}

    case types.SHOW_PLAYER:
      return {...state, showPlayer: true}

    case types.VOLUME_SET:
      return {...state, volume: action.value}

    case types.SET_PLAYER_PROGRESS:
      return {...state, ...action.value}

    case types.SET_PLAYER_DURATION:
      return {...state, duration: action.value}

    case types.SET_PLAYER_PLAYED_SECONDS:
      return {...state, playedSeconds: action.value}

    case types.SET_CURRENT_TIME:
      return {...state, currentTime: action.value}

    case types.REGISTER_PLAYER_ERROR:
      return {...state, errorCount: state.errorCount + 1}

    case types.CLEAR_PLAYER_ERRORS:
    case types.SONG_PLAYED:
      return {...state, errorCount: 0}

    case types.SET_CURRENT_PLAYING_URL:
      return {
      ...state,
      playedSeconds: 0,
      loadedSeconds: 0,
      streamUri: action.url
    }

    case types.TOGGLE_FULL_SCREEN:
      return {...state, fullscreen: !state.fullscreen}

    case types.SET_FULL_SCREEN:
      return {...state, fullscreen: true}

    case types.SET_CURRENT_PLAYING_STREAMS:
      return {...state, streams: action.streams}

    case types.SET_CACHED_DATA: {
      return action.data.player
    }

    default:
      return state
  }
}
