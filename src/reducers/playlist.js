// @flow

import * as types from '../constants/ActionTypes'
import { Action } from 'redux'

import Song from '../entities/Song'

type State = {
  currentPlaying?: Song | any,
  nextSongId?: string,
  prevSongId?: string,
  trackIds: Array<string>,
  playing: boolean
}

const defaultState = {
  currentPlaying: {},
  nextSongId: undefined,
  prevSongId: undefined,
  trackIds: [],
  playing: false
}

const populateTracks = (songs): Array<string> => {
  const tracks = []
  songs.forEach((song) => {
    if (song.id) {
      tracks.push(song.id)
    } else {
      tracks.push(song)
    }
  })

  return tracks
}

// Get sibling songs ids to know which is the next and prev song
const getSiblingSong = (trackIds: Array<string>, song, next = false) => {
  const tracksIndex = {}
  const position = trackIds.indexOf(song.id)
  trackIds.forEach((trackId, index) => {
    tracksIndex[index] = trackId
  })

  if (next) {
    return tracksIndex[position+1]
  }

  return tracksIndex[position-1]
}

const extractField = (song, field) => {
  return field.split('.').reduce((obj: any, i): any => {
    return obj[i] ? obj[i]: '0'
  }, song)
}

export const sortTrackIds = (tracks: any, field: string, direction: string) => {
  const songsIds = Object.keys(tracks)
  return songsIds.sort((songId1: string, songId2: string) => {
    const song1 = tracks[songId1]
    const song2 = tracks[songId2]
    const song1Field = extractField(song1, field)
    const song2Field = extractField(song2, field)

    if (song1Field < song2Field) {
      return direction === 'ASC' ? -1: 1
    }
    if (song1Field > song2Field) {
      return direction === 'ASC' ? 1: -1
    }

    return 0
  })
}

export default (state: State = defaultState, action: Action = {}): State => {
  switch (action.type) {

    case types.SET_CURRENT_PLAYING:
      return {
        ...state,
        currentPlaying: action.song,
        prevSongId: getSiblingSong(state.trackIds, action.song),
        nextSongId: getSiblingSong(state.trackIds, action.song, true),
      }

    case types.START_PLAYING:
      return {...state, playing: true}

    case types.ADD_TO_PLAYLIST:
      const mergedTrackIds = [...state.trackIds, ...populateTracks([action.song])]
      return {
        ...state,
        trackIds: mergedTrackIds
      }

    case types.ADD_SONGS_TO_PLAYLIST:
      const trackIds = populateTracks(action.songs)
      return {
        ...state,
        trackIds
      }

    case types.SET_COLUMN_SORT:
      return {...state, trackIds: sortTrackIds(action.songs, action.column)}

    default:
      return state
  }
}
