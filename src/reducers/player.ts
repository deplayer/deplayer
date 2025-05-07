import * as types from '../constants/ActionTypes'

type PlayerAction =
  | { type: typeof types.PAUSE_PLAYING | typeof types.STOP_PLAYING | typeof types.START_PLAYING | typeof types.TOGGLE_PLAYING | typeof types.CLEAR_QUEUE | typeof types.HIDE_PLAYER | typeof types.SHOW_PLAYER | typeof types.CLEAR_PLAYER_ERRORS | typeof types.SONG_PLAYED }
  | { type: typeof types.VOLUME_SET | typeof types.SET_PLAYER_DURATION | typeof types.SET_CURRENT_TIME; value: number }
  | { type: typeof types.SET_CURRENT_PLAYING_URL; url: string }
  | { type: typeof types.SET_CURRENT_PLAYING_STREAMS; streams: object }
  | { type: typeof types.REGISTER_PLAYER_ERROR }
  | { type: typeof types.TOGGLE_FULL_SCREEN; payload?: boolean }
  | { type: typeof types.SET_PEER_STREAMING; payload: { isStreaming: boolean; peerId: string | null } }

export interface State {
  playing: boolean
  duration: number
  currentTime: number
  volume: number
  showPlayer: boolean
  streamUri: string | null
  streams: object
  errorCount: number
  fullscreen: boolean
  peerStreaming: {
    isStreaming: boolean
    peerId: string | null
  }
}

export const defaultState: State = {
  playing: false,
  duration: 0,
  currentTime: 0,
  volume: 100,
  showPlayer: false,
  streamUri: null,
  streams: {},
  errorCount: 0,
  fullscreen: false,
  peerStreaming: {
    isStreaming: false,
    peerId: null
  }
}

export default (state: State = defaultState, action: PlayerAction): State => {
  switch (action.type) {
    case types.PAUSE_PLAYING:
    case types.STOP_PLAYING:
      return { ...state, playing: false }

    case types.START_PLAYING:
      return { ...state, playing: true, showPlayer: true }

    case types.TOGGLE_PLAYING:
      return { ...state, playing: !state.playing }

    case types.CLEAR_QUEUE:
    case types.HIDE_PLAYER:
      return { ...state, showPlayer: false }

    case types.SHOW_PLAYER:
      return { ...state, showPlayer: true }

    case types.VOLUME_SET:
      return { ...state, volume: action.value }

    case types.SET_PLAYER_DURATION:
      return { ...state, duration: action.value }

    case types.REGISTER_PLAYER_ERROR:
      return { ...state, errorCount: state.errorCount + 1 }

    case types.CLEAR_PLAYER_ERRORS:
    case types.SONG_PLAYED:
      return { ...state, errorCount: 0 }

    case types.SET_CURRENT_PLAYING_URL:
      return {
        ...state,
        streamUri: action.url
      }

    case types.TOGGLE_FULL_SCREEN:
      if (action.payload) {
        return { ...state, fullscreen: !!action.payload }
      }

      return { ...state, fullscreen: !state.fullscreen }

    case types.SET_CURRENT_PLAYING_STREAMS:
      return { ...state, streams: action.streams }

    case types.SET_CURRENT_TIME:
      return { ...state, currentTime: action.value }

    case types.SET_PEER_STREAMING:
      return {
        ...state,
        peerStreaming: {
          isStreaming: action.payload.isStreaming,
          peerId: action.payload.peerId
        }
      };

    default:
      return state
  }
}
