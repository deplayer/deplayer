import * as types from '../constants/ActionTypes'
import {
  populateTracks,
  getSiblingSong
} from './utils/queues'

type State = {
  trackIds: Array<string>,
  currentPlaying: string|null,
  repeat: boolean,
  nextSongId: string|null,
  prevSongId: string|null
}

export const defaultState = {
  trackIds: [],
  currentPlaying: null,
  repeat: false,
  nextSongId: null,
  prevSongId: null
}

const shuffleArray = (array) => {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }

  return array
}

const setCurrentPlaying = (state: any, action: any) => {
  const scTracks = state.trackIds.includes(action.songId)
    ? state.trackIds
    : [...state.trackIds, action.songId]
  return {
    ...state,
    trackIds: scTracks,
    currentPlaying: action.songId,
    prevSongId: getSiblingSong(scTracks, action.songId),
    nextSongId: getSiblingSong(scTracks, action.songId, true),
  }
}

export default (state: State = defaultState, action: any  = {}): State => {
  switch (action.type) {

    case types.RECEIVE_QUEUE:
      return {...state, ...action.queue}

    case types.ADD_TO_QUEUE:
      const mergedTrackIds = [...state.trackIds, ...populateTracks([action.song])]
      return {
        ...state,
        trackIds: mergedTrackIds
      }

    case types.ADD_SONGS_TO_QUEUE_BY_ID:
      if (action.replace) {
        return {
          ...state,
          trackIds: action.trackIds
        }
      }

      return {
        ...state,
        trackIds: state.trackIds.concat(action.trackIds)
      }

    case types.ADD_SONGS_TO_QUEUE:

      if (action.replace) {
        return {
          ...state,
          trackIds: populateTracks(action.songs)
        }
      }

      const tracks = state.trackIds.concat(populateTracks(action.songs))
      const cleanedTracks = tracks.filter((item, pos) => tracks.indexOf(item) === pos)

      return {
        ...state,
        trackIds: cleanedTracks
      }

    case types.SET_CURRENT_PLAYING:
      return setCurrentPlaying(state, action)

    case types.PLAY_NEXT:
      if (state.nextSongId) {
        return setCurrentPlaying(state, {songId: state.nextSongId})
      }

      // Handling repeat
      if (state.repeat && state.trackIds[0]) {
        return setCurrentPlaying(state, {songId: state.trackIds[0]})
      }

      return state

    case types.PLAY_PREV:
      if (state.prevSongId) {
        return setCurrentPlaying(state, {songId: state.prevSongId})
      }

      return state

    case types.CLEAR_QUEUE:
      return defaultState

    case types.SHUFFLE:
      return {
        ...state,
        trackIds: shuffleArray(state.trackIds)
      }

    case types.REPEAT:
      return {
        ...state,
        repeat: !state.repeat
      }

    default:
      return state
  }
}
