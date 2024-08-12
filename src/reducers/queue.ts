import * as types from '../constants/ActionTypes'
import Media from '../entities/Media'
import {
  getSiblingSong
} from './utils/queues'

export type State = {
  trackIds: Array<string>,
  randomTrackIds: Array<string>,
  currentPlaying: string | null,
  repeat: boolean,
  shuffle: boolean,
  nextSongId: string | null,
  prevSongId: string | null
}

export const defaultState = {
  trackIds: [],
  randomTrackIds: [],
  currentPlaying: null,
  repeat: false,
  shuffle: false,
  nextSongId: null,
  prevSongId: null
}

const shuffleArray = (array: Array<any>) => {
  const newArray = [...array]

  for (var i = newArray.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = newArray[i];
    newArray[i] = newArray[j];
    newArray[j] = temp;
  }

  return newArray
}

const setCurrentPlaying = (state: any, action: any) => {
  const sourceIds = getCurrentQueue(state)
  const scTracks = sourceIds.includes(action.songId)
    ? sourceIds
    : [...sourceIds, action.songId]

  return {
    ...state,
    trackIds: scTracks,
    currentPlaying: action.songId,
    prevSongId: getSiblingSong(scTracks, action.songId),
    nextSongId: getSiblingSong(scTracks, action.songId, true),
  }
}

const getCurrentQueue = (state: State): Array<string> => {
  if (state.shuffle) {
    return state.randomTrackIds
  }

  return state.trackIds
}

export default (state: State = defaultState, action: any = {}): State => {
  switch (action.type) {

    case types.RECEIVE_QUEUE:
      return { ...state, ...action.queue }

    case types.ADD_TO_QUEUE: {
      const trackIds = getCurrentQueue(state)
      const filteredTracks = new Set(trackIds.concat(action.songs.map((song: Media) => song.id)))
      return {
        ...state,
        trackIds: [...filteredTracks]
      }
    }

    case types.ADD_TO_QUEUE_NEXT: {
      const trackIds = getCurrentQueue(state)

      if (!state.currentPlaying) {
        return state
      }

      const currPosition = trackIds.indexOf(state.currentPlaying)
      const songs = action.songs.map((song: Media) => song.id)
      const newIds = [...trackIds]

      newIds.splice(
        currPosition + 1,
        0,
        ...songs
      )
      if (state.shuffle) {
        return setCurrentPlaying({
          ...state,
          randomTrackIds: new Set(newIds)
        }, { songId: state.currentPlaying })
      } else {
        return setCurrentPlaying({
          ...state,
          trackIds: new Set(newIds)
        }, { songId: state.currentPlaying })
      }
    }

    case types.REMOVE_FROM_QUEUE:
      const queueTracks = new Set([
        ...state.trackIds.splice(
          state.trackIds.indexOf(action.song.id)
        )
      ])
      return {
        ...state,
        trackIds: [...queueTracks]
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
          trackIds: action.songs.map((song: Media) => song.id)
        }
      }

      const tracks = state.trackIds.concat(action.songs)
      const cleanedTracks = tracks.filter((item, pos) => tracks.indexOf(item) === pos)

      return {
        ...state,
        trackIds: cleanedTracks
      }

    case types.SET_CURRENT_PLAYING:
      return setCurrentPlaying(state, action)

    case types.CLEAR_QUEUE:
      return defaultState

    case types.SHUFFLE:
      return {
        ...state,
        shuffle: !state.shuffle,
        randomTrackIds: shuffleArray(state.trackIds)
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
