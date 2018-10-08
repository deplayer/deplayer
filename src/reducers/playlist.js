// @flow

import * as types from '../constants/ActionTypes'
import { Action } from 'redux'

import Song from '../entities/Song'

type State = {
  currentPlaying?: Song | any,
  nextSongId?: string,
  prevSongId?: string,
  tracks: any,
  trackIds: Array<string>,
  playing: boolean
}

const defaultState = {
  currentPlaying: {},
  nextSongId: undefined,
  prevSongId: undefined,
  tracks: {},
  trackIds: [],
  playing: false
}

const populateTracks = (songs) => {
  const tracks = {}
  songs.forEach((song) => {
    tracks[song.id] = song
  })

  return tracks
}

// Get sibling songs ids to know which is the next and prev song
const getSiblingSong = (tracks, song, next = false) => {
  const tracksIndex = {}
  const position = Object.keys(tracks).indexOf(song.id)
  Object.keys(tracks).forEach((trackId, index) => {
    tracksIndex[index] = trackId
  })

  if (next) {
    return tracksIndex[position+1]
  }

  return tracksIndex[position-1]
}

const sortTracks = (tracks, field, direction) => {
  if (!Object.keys(tracks).length) {
    return []
  }

  const songs = Object.keys(tracks).map((songId) => {
    return tracks[songId]
  })

  const sortedSongs = songs.sort((song1, song2) => {
    return song1[field] - song2[field]
  })

  const sortedSongsIds = []
  sortedSongs.forEach((song) => {
    sortedSongsIds.push(song.id)
  })

  return sortedSongsIds
}

export default (state: State = defaultState, action: Action = {}): State => {
  switch (action.type) {

    case types.SET_CURRENT_PLAYING:
      return {
        ...state,
        currentPlaying: action.song,
        prevSongId: getSiblingSong(state.tracks, action.song),
        nextSongId: getSiblingSong(state.tracks, action.song, true),
      }

    case types.START_PLAYING:
      return {...state, playing: true}

    case types.ADD_TO_PLAYLIST:
      const tracks = populateTracks([action.song])
      const mergedTracks = {...state.tracks, ...tracks}
      return {
        ...state,
        tracks: mergedTracks,
        trackIds: Object.keys(mergedTracks)
      }

    case types.ADD_SONGS_TO_PLAYLIST:
      const newTracks = populateTracks(action.songs)
      const allTracks = {...state.tracks, ...newTracks}
      return {
        ...state,
        tracks: allTracks,
        trackIds: Object.keys(allTracks)
      }

    case types.SET_COLUMN_SORT:
      const trackIds = sortTracks(state.tracks)
      return {...state, trackIds: trackIds}

    default:
      return state
  }
}
